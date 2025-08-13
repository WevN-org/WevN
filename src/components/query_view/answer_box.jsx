export default function AnswerBox({ children }) {
    return (
        <div className="flex-1 bg-white p-4 md:p-6 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg flex items-end">
            <p className="text-base text-gray-700 leading-relaxed">{children}</p>
        </div>
    );
}
