
import os
import asyncio
from typing import Optional
from langchain_core.prompts import PromptTemplate
from langchain_community.chat_message_histories import SQLChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from sentence_transformers import SentenceTransformer
from langchain_core.output_parsers import PydanticOutputParser

from .config import LLM_IMPORT, LLM_MODEL, GROQ_API_KEY
from .models import CustomSummary
from .database import async_engine

# Globals
model = None
model_ready = asyncio.Event()

llm = None
llm_ready = asyncio.Event()
summary_llm_ready = asyncio.Event()
llm_error: Optional[str] = None
prompt = None
raw_chain = None
chain_with_memory = None

if LLM_IMPORT:
    from langchain_groq import ChatGroq
    from langchain_openai import ChatOpenAI

def create_summarization_chain():
    """Builds a chain that returns a structured CustomSummary object."""
    
    # CHANGED: Replaced ChatOpenAI with ChatGroq.
    summarizer_llm = ChatGroq(
        model=LLM_MODEL,
        temperature=0,
        api_key=GROQ_API_KEY
    )

    # Set up a parser + format instructions
    parser = PydanticOutputParser(pydantic_object=CustomSummary)

    prompt_template = PromptTemplate(
        template="""
        You are an expert at creating concise, self-contained knowledge nodes from conversations.
        
        {format_instructions}

        The user's instruction is: {task_description}.
        When the instruction is to create a 'node', you must analyze the conversation below and distill its core ideas into a single summary.

        - The 'name' for the node should be a very short, descriptive title (under 5 words) that captures the main subject.
        - The 'content' for the node should be a clear and concise paragraph summarizing the key information, question, or conclusion from the text.

        Based ONLY on the provided text, generate the 'name' and 'content'.

        --- CONVERSATION START ---
        {formatted_memory}
        --- CONVERSATION END ---
        """,
        input_variables=["task_description", "formatted_memory"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    # Chain: Prompt -> LLM -> Parser
    return prompt_template | summarizer_llm | parser


async def load_model():
    """Loads the sentence transformer embedding model."""
    global model
    if model is None:
        local_path = "../__models__/embedding-model/models--sentence-transformers--all-mpnet-base-v2/snapshots/e8c3b32edf5434bc2275fc9bab85f82640a19130"
        if os.path.exists(local_path):
            print("✅ Loading embedding model from local cache...")
            model = await asyncio.to_thread(lambda: SentenceTransformer(local_path))
            print("Embedding model loaded!")
            model_ready.set()
        else:
            print("🌐 Downloading embedding model from Hugging Face...")
            model = await asyncio.to_thread(
                lambda: SentenceTransformer(
                    "all-mpnet-base-v2",
                    cache_folder="../__models__/embedding-model",
                )
            )
            print("Embedding model loaded!")
            model_ready.set()

async def load_llm_and_parser(app):
    """Initializes the OpenAI LLM and the main conversation chain."""
    global llm, llm_error, prompt, chain_with_memory
    if llm is None:
        try:
            # ---------------------------
            # 2. LLM + Memory
            # ---------------------------
            print(f"🚀 Initializing Groq model: {LLM_MODEL}...")
            llm = ChatGroq(
                model=LLM_MODEL,
                temperature=0,
                streaming=True, # Set to True for streaming responses
                verbose=True,
                api_key=GROQ_API_KEY,
            )

            # Health check to ensure the model is responsive
            def health_check():
                resp = llm.invoke("hello")
                return resp

            await asyncio.to_thread(health_check)
            print(f"✅ LLM (LangChain ChatOpenAI with model '{llm.model_name}') is ready.")
            llm_ready.set()

            # The prompt template for the main chat logic.
            template = """
                You are **WevN Assistant**, a versatile and helpful AI companion.
                Your job is to provide accurate, relevant, and natural answers.

                ### Core Rules
                1. First, check the `<retrieved_documents>` and `<chat_history>` for answers. If found, integrate them naturally.
                2. If context is missing or insufficient, rely on your own knowledge.
                3. Adapt your tone: friendly for casual chat, professional for technical topics.
                4. Do not repeat the user’s question. Start directly with the answer.
                5. Never output meta-reasoning or instructions.

                ### Information Sources
                - Chat history:
                {conversation}

                - Retrieved documents:
                {context}

                ### Task
                User question: {question}

                ### Response
                Provide a clear, helpful answer below:
                """

            prompt_template = PromptTemplate(
                template=template,
                input_variables=["conversation", "context", "question"],
            )

            # The core chain and memory setup.
            core_chain = prompt_template | llm
            chain_with_memory = RunnableWithMessageHistory(
                core_chain,
                lambda session_id: SQLChatMessageHistory(
                    session_id=session_id,
                    connection=async_engine, # Assumes async_engine is defined elsewhere
                ),
                input_messages_key="question",
                history_messages_key="conversation",
            )

            print("✅ Chain with async memory history is ready.")
            print("Initializing Summarization chain...")
            app.state.db_engine = async_engine
            summarization_chain = create_summarization_chain()
            app.state.summarization_chain = summarization_chain
            summary_llm_ready.set()
            print("✅ Summarization chain is ready.")

        except Exception as e:
            llm_error = str(e) # Store as string to avoid pickling issues?
            print(f"❌ LLM Error: {e}")

async def model_embedding(text: str) -> list[float]:
    await model_ready.wait()
    return await asyncio.to_thread(lambda: model.encode(text))
