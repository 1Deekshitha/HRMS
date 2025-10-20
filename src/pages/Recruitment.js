import React, { useState, useEffect, useRef } from "react";

const Recruitment = () => {
  const [resume, setResume] = useState(null);
  const [screeningResult, setScreeningResult] = useState(null);

  // Chatbot state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
    setScreeningResult(null); // Reset result on new file selection
  };

  const handleScreenResume = async () => {
    if (!resume) {
      alert("Please upload a resume first.");
      return;
    }

    setScreeningResult("Screening in progress...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

    // Simulated AI Result
    const randomScore = Math.floor(Math.random() * (95 - 75 + 1)) + 75;
    setScreeningResult({
      fileName: resume.name,
      matchScore: `${randomScore}%`,
      summary: "This is a simulated AI summary of the resume. The candidate seems to be a good fit for the role based on their experience with React and Node.js. They also have experience with cloud platforms which is a plus.",
      keywords: ["React", "Node.js", "JavaScript", "Cloud", "Agile"],
    });
  };

  // --- Chatbot Logic ---

  useEffect(() => {
    // Initial bot message
    if (messages.length === 0) {
      setTimeout(() => {
        setMessages([{ sender: "bot", text: "Hello! I'm the AI Assistant. I'd like to ask you a few screening questions to get started. What is your full name?" }]);
      }, 1000);
    }
  }, [messages.length]);

  useEffect(() => {
    // Auto-scroll to the latest message
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    const lastUserMessage = input;
    setInput("");
    setIsTyping(true);

    // Simulated bot response logic
    setTimeout(() => {
      let botResponse = "Thank you for your time. A human recruiter will review your conversation and get back to you soon. Goodbye!";

      if (messages.length <= 2) {
        botResponse = `Nice to meet you, ${lastUserMessage}! How many years of experience do you have with modern JavaScript frameworks like React or Vue?`;
      } else if (messages.length <= 4) {
        botResponse = "That's good to know. What is your expected annual salary?";
      } else if (messages.length <= 6) {
        botResponse = "Thank you. Finally, can you tell me about your experience with remote work and why you are interested in this role?";
      }

      setMessages(prev => [...prev, { sender: "bot", text: botResponse }]);
      setIsTyping(false);
    }, 2500);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">AI-Powered Recruitment</h1>
      
      {/* --- AI-Powered Resume Screening --- */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Automated Resume Screening</h2>
        <p className="text-gray-600 mb-6">
          Upload a resume (PDF or DOCX) to have our AI analyze it and provide a screening report.
        </p>
        <div className="border border-gray-200 p-6 rounded-lg">
          <div className="flex items-center space-x-4">
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept=".pdf,.doc,.docx"
            />
            <button
              onClick={handleScreenResume}
              disabled={!resume}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              Screen Resume
            </button>
          </div>
          {screeningResult && (
            <div className="mt-6">
              {typeof screeningResult === 'string' ? (
                <p className="text-gray-600 animate-pulse">{screeningResult}</p>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="text-xl font-semibold text-gray-800">Screening Result</h3>
                  <p className="mt-2"><strong>File:</strong> {screeningResult.fileName}</p>
                  <p className="mt-2"><strong>AI Match Score:</strong> <span className="font-bold text-green-600 text-lg">{screeningResult.matchScore}</span></p>
                  <p className="mt-2"><strong>Summary:</strong> {screeningResult.summary}</p>
                  <div className="mt-2">
                    <strong>Keywords Found:</strong>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {screeningResult.keywords.map(k => <span key={k} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{k}</span>)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- AI-Powered Conversation --- */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">AI Screening Chat</h2>
        <div className="border border-gray-200 rounded-lg h-[32rem] flex flex-col">
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                <div className={`p-3 rounded-lg max-w-lg ${msg.sender === 'bot' ? 'bg-gray-200 text-gray-800' : 'bg-blue-600 text-white'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="p-3 rounded-lg bg-gray-200 text-gray-500">
                  Typing...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 border-t border-gray-200">
            <div className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-grow border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message..."
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white font-semibold px-6 rounded-r-lg hover:bg-blue-700 disabled:bg-gray-400"
                disabled={isTyping || !input.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recruitment;