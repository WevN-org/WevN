async def ask_stream(question: str):
    await llm_ready.wait()
    history_vars = summary_memory.load_memory_variables({})
    history = history_vars.get("history", "")

    buffer = ""
    json_started = False
    json_braces = 0
    partial_accum = ""  # accumulate partial tokens

    async for chunk in raw_chain.astream({"input": question, "history": history}):
        if chunk.content:
            token = chunk.content
            buffer += token
            partial_accum += token  # accumulate for front-end
            yield json.dumps({"type": "partial", "content": partial_accum}) + "\n"

            # Track JSON block
            for char in token:
                if char == "{":
                    if not json_started:
                        json_started = True
                    json_braces += 1
                elif char == "}":
                    json_braces -= 1

            # If we detect a complete JSON object, parse it immediately
            if json_started and json_braces == 0:
                try:
                    json_text = re.search(r"\{.*?\}", buffer, re.DOTALL).group(0)
                    parsed = parser.parse(json_text)
                    summary_memory.save_context({"input": question}, {"output": parsed.Answer})
                    print("✅ Parsed:", parsed)

                    # Send final parsed JSON
                    yield json.dumps({
                        "type": "parsed",
                        "Answer": parsed.Answer,
                        "Command": parsed.Command
                    }) + "\n"

                except Exception as e:
                    yield json.dumps({"type": "error", "message": str(e)}) + "\n"
                finally:
                    buffer = ""
                    json_started = False
                    json_braces = 0
                    partial_accum = ""  # reset partial accumulation

    # Signal end of stream
    yield json.dumps({"type": "done"}) + "\n"

    async def ask_stream(question: str):
    await llm_ready.wait()
    history_vars = summary_memory.load_memory_variables({})
    history = history_vars.get("history", "")

    buffer = ""
    json_started = False
    json_braces = 0

    async for chunk in raw_chain.astream({"input": question, "history": history}):
        if chunk.content:
            token = chunk.content
            buffer += token

            # Track JSON block
            for char in token:
                if char == "{":
                    if not json_started:
                        json_started = True
                    json_braces += 1
                elif char == "}":
                    json_braces -= 1

            # Yield partial stream for UI (optional)
            yield json.dumps({"type": "partial", "content": token}) + "\n"

            # If we detect a complete JSON object, parse it immediately
            if json_started and json_braces == 0:
                try:
                    json_text = re.search(r"\{.*?\}", buffer, re.DOTALL).group(0)
                    parsed = parser.parse(json_text)
                    summary_memory.save_context({"input": question}, {"output": parsed.Answer})
                    print("✅ Parsed:", parsed)

                    # Send parsed JSON to front-end
                    yield json.dumps({
                        "type": "parsed",
                        "Answer": parsed.Answer,
                        "Command": parsed.Command
                    }) + "\n"

                except Exception as e:
                    yield json.dumps({"type": "error", "message": str(e)}) + "\n"
                finally:
                    buffer = ""  # reset
                    json_started = False
                    json_braces = 0

    # Signal end of stream
    yield json.dumps({"type": "done"}) + "\n"