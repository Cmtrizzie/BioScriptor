
import React, { useEffect } from "react";
import { useRoute } from "wouter";
import ChatInterface from "@/components/chat/ChatInterface";

export default function Chat() {
  const [match, params] = useRoute("/chat/:sessionId?");
  
  return <ChatInterface sessionId={params?.sessionId} />;
}
