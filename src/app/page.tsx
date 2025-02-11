"use client";
import "regenerator-runtime/runtime";
import { useState, useRef, useEffect } from "react";
import Dropzone from "react-dropzone";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Image, { StaticImageData } from "next/image";
import { motion } from "framer-motion";
import {
  MessageCircle,
  X,
  Upload,
  Shirt,
  Mic,
  AudioLines,
  SendHorizontal,
} from "lucide-react";
import Jacket from "@/assets/jacket.jpg";
import ShirtImage from "@/assets/shirt.jpg";
import Dress from "@/assets/dress.jpg";
import { Spinner } from "@heroui/spinner";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

interface Message {
  text: string;
  sender: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [tryOnPreviews, setTryOnPreviews] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [fetchinTryonResult, setFetchinTryonResult] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);
  const [selectedGarment, setSelectedGarment] = useState<string | null>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  const [isRecording, setIsRecording] = useState(false);

  const handleSendMessage = async () => {
    if (userInput.trim() !== "") {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: userInput, sender: "user" },
        { text: "Thinking...", sender: "ai" },
      ]);

      // setMessages((prevMessages) => [...prevMessages, ]);

      setUserInput("");

      try {
        const response = await fetch("/api/openai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: userInput }),
        });

        const data = await response.json();
        const aiResponse = data.response;

        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1), // Remove "Thinking..."
          { text: aiResponse, sender: "ai" },
        ]);
      } catch (error) {
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1), // Remove "Thinking..."
          { text: "Error retrieving response.", sender: "ai" },
        ]);
        console.error("Error calling OpenAI API:", error);
      }
    }
  };

  const getGarmentBlob = async (image: StaticImageData) => {
    const response = await fetch(image.src);
    return response.blob();
  };

  const handleImageUpload = async (acceptedFiles: any[]) => {
    if (!selectedGarment) return alert("Please select a garment first.");

    let garmentBlob = null;
    if (selectedGarment === "shirt") {
      garmentBlob = await getGarmentBlob(ShirtImage);
    } else if (selectedGarment === "jacket") {
      garmentBlob = await getGarmentBlob(Jacket);
    } else if (selectedGarment === "dress") {
      garmentBlob = await getGarmentBlob(Dress);
    }

    const formData = new FormData();
    acceptedFiles.forEach((file) => formData.append("images", file));
    if (garmentBlob) {
      formData.append("garment", garmentBlob, "garment.png");
    }
    setFetchinTryonResult(true);
    try {
      const response = await axios.post("/api/tryon", formData);
      if (response?.status === 200) {
        setTryOnPreviews(response.data.preview);
      }
      setFetchinTryonResult(false);
    } catch (error) {
      setFetchinTryonResult(false);

      console.error("Error uploading images:", error);
    }
  };

  const startListening = () => {
    setIsRecording(true);
    SpeechRecognition.startListening({ continuous: true, language: "en-US" });
  };

  const stopListening = () => {
    setIsRecording(false);
    SpeechRecognition.stopListening();
    handleSendMessage();

    setTimeout(() => {
      resetTranscript(); // Ensure transcript resets after speech recognition fully stops
    }, 500); // Small delay (adjust if necessary)

    setIsListening(false);
  };

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      alert("Your browser does not support speech recognition.");
    }
  }, [browserSupportsSpeechRecognition]);

  useEffect(() => {
    transcript?.length > 0 && setUserInput(transcript);
  }, [transcript]);

  return (
    <div
      className={`relative min-h-screen flex items-center justify-center transition-all duration-500
         bg-[radial-gradient(ellipse_at_bottom,_rgba(98,0,234,0.7),_rgba(236,72,153,0.5),_rgba(255,94,77,0.3),_rgba(0,0,0,0.9))]`}
    >
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <motion.div
          // onClick={() => setShowTryOn(true)}
          className="flex items-center bg-white shadow-lg rounded-full px-2 py-2 space-x-3 cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
        >
          {!isOpen && !showTryOn && (
            <motion.div
              onClick={() => setShowTryOn(true)}
              className="flex items-center bg-white shadow-lg rounded-full p-2 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
            >
              <Shirt className="h-6 w-6 text-gray-600" />
            </motion.div>
          )}
          {!isOpen && !showTryOn && (
            <motion.div
              onClick={() => setIsOpen(true)}
              className="flex items-center  rounded-full px-1 py-2 space-x-3 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-sm text-gray-500">Ask anything...</span>
            </motion.div>
          )}
          {!isOpen && !showTryOn && (
            <motion.div
              onClick={() => setIsListening(true)}
              className="flex items-center bg-white shadow-lg rounded-full px-2 py-2 space-x-3 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
            >
              <AudioLines
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(true);
                  isRecording ? stopListening() : startListening();
                }}
                className={`${
                  isRecording ? "text-red-500" : ""
                } cursor-pointer`}
              />
              {/* </Button> */}
            </motion.div>
          )}
        </motion.div>
      </div>

      {isOpen && !showTryOn && (
        <motion.div
          className="shadow-2xl rounded-xl p-4 w-96 max-w-full absolute bottom-16 bg-white"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex justify-between items-center mb-4 ">
            <h3 className="text-lg font-bold">Your AI Assistant</h3>
            <X
              className="cursor-pointer"
              onClick={() => {
                setIsOpen(false);
                setMessages([]);
              }}
            />
          </div>
          <div className="h-64 overflow-y-auto mb-4 border border-gray-300 rounded p-2 custom-scrollbar">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${
                  msg.sender === "user" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={`${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                      : ""
                  } p-2 rounded inline-block max-w-xs`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className={`${
                isRecording ? "w-[90%]" : "w-[80%]"
              } border rounded p-2 text-sm border-gray-300`}
              placeholder={isRecording ? "Listening ..." : "Type a message..."}
            />{" "}
            {!isRecording && !isListening && (
              // <Button onClick={handleSendMessage} className="ml-2">
              //   Send
              // </Button>
              <SendHorizontal
                onClick={handleSendMessage}
                className="m-1 rounded text-sm w-[10%] cursor-pointer"
              />
            )}
            <AudioLines
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
                isRecording ? stopListening() : startListening();
              }}
              className={`${
                isRecording ? "text-red-500" : ""
              } w-[10%] cursor-pointer`}
            />
          </div>
        </motion.div>
      )}

      {showTryOn && (
        <motion.div className="bg-white shadow-2xl rounded-xl p-4 w-96 max-w-full absolute bottom-16">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Tryon Garment</h3>
            <X
              className="cursor-pointer"
              onClick={() => {
                setShowTryOn(false);
                setTryOnPreviews(null);
              }}
            />
          </div>
          {/* {fetchinTryonResult ? (
            <div className="flex justify-center">
              <Spinner />
            </div>
          ) : tryOnPreviews ? (
            <div className="flex justify-center">
              <Image src={tryOnPreviews} width={250} height={250} alt="" />
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold mb-2">Select a Garment</h3>
              <div className="flex space-x-2 mb-4">
                {[
                  { src: ShirtImage, name: "shirt" },
                  { src: Jacket, name: "jacket" },
                  { src: Dress, name: "dress" },
                ].map((item, idx) => (
                  <Image
                    key={idx}
                    src={item.src}
                    width={50}
                    height={50}
                    alt=""
                    className={`cursor-pointer rounded border ${
                      selectedGarment === item.name
                        ? "border-blue-500"
                        : "border-gray-300"
                    }`}
                    onClick={() => setSelectedGarment(item.name)}
                  />
                ))}
              </div>
              {selectedGarment && (
                <Dropzone onDrop={handleImageUpload}>
                  {({ getRootProps, getInputProps }) => (
                    <div
                      {...getRootProps()}
                      className="border bg-gray-100 flex justify-center rounded p-4 cursor-pointer"
                    >
                      <input {...getInputProps()} />
                      <Upload className="h-4 w-6 text-gray-500" />
                      <p className="text-gray-500 text-sm">
                        Upload your picture
                      </p>
                    </div>
                  )}
                </Dropzone>
              )}
            </>
          )} */}
          {fetchinTryonResult ? (
            <div className="flex justify-center">
              <Spinner />
            </div>
          ) : tryOnPreviews ? (
            <div className="flex flex-col items-center">
              <Image
                src={tryOnPreviews}
                width={350}
                height={350}
                alt="Try-On Preview"
                className="rounded-xl shadow-lg border-2 border-gray-300"
              />
              <button
                onClick={() => {
                  setTryOnPreviews(null);
                  setSelectedGarment(null);
                  setShowTryOn(true);
                }}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition"
              >
                Try Another
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold mb-4 text-center text-white">
                Select a Garment
              </h3>
              <div className="flex justify-center space-x-4 mb-6">
                {[
                  { src: ShirtImage, name: "shirt" },
                  { src: Jacket, name: "jacket" },
                  { src: Dress, name: "dress" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`relative border-2 rounded-lg p-2 transition ${
                      selectedGarment === item.name
                        ? "border-indigo-500 scale-110 shadow-lg"
                        : "border-gray-300"
                    } cursor-pointer hover:scale-105`}
                    onClick={() => setSelectedGarment(item.name)}
                  >
                    <Image
                      src={item.src}
                      width={60}
                      height={60}
                      alt={item.name}
                    />
                    {selectedGarment === item.name && (
                      <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                        Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedGarment && (
                <Dropzone onDrop={handleImageUpload}>
                  {({ getRootProps, getInputProps }) => (
                    <div
                      {...getRootProps()}
                      className="border-2 border-dashed bg-white/20 backdrop-blur-lg flex flex-col items-center justify-center rounded-lg p-6 cursor-pointer hover:bg-white/30 transition"
                    >
                      <input {...getInputProps()} />
                      <Upload className="h-6 w-6 text-gray-500 mb-2" />
                      <p className="text-gray-500 text-sm">
                        Upload Your Picture
                      </p>
                    </div>
                  )}
                </Dropzone>
              )}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
