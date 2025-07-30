
import React, { useEffect } from "react";
import { useRoute } from "wouter";
import ChatInterface from "@/components/chat/ChatInterface";

export default function Chat() {
  const [match, params] = useRoute("/chat/:sessionId?");
  
  useEffect(() => {
    console.log('Chat component mounted, sessionId:', params?.sessionId);
  }, [params?.sessionId]);
  
  return (
    <div className="h-screen w-full">
      <ChatInterface sessionId={params?.sessionId} />
    </div>
  );
}
