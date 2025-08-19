export default function AnswerBox({ children }) {
    return (
        <div className="flex-1 grid place-items-center p-4 md:p-6 transition-all duration-200 ">
            <p className="text-base text-gray-700 leading-relaxed">{children}</p>
        </div>
    );
}
