"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  getCopilotConversations,
  getCopilotConversation,
  createCopilotConversation,
  deleteCopilotConversation,
  updateCopilotConversation,
  sendCopilotMessage,
  getCopilotSuggestions,
} from "@/actions/copilot.action";

const CopilotContext = createContext(null);

export function CopilotProvider({ children }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    const res = await getCopilotConversations();
    if (res.success && Array.isArray(res.data)) {
      setConversations(res.data);
    } else {
      setConversations([]);
    }
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    const res = await getCopilotSuggestions();
    if (res.success && Array.isArray(res.data)) {
      setSuggestions(res.data);
    } else {
      setSuggestions([]);
    }
  }, []);

  // Fetch conversations on mount and when panel opens
  useEffect(() => {
    if (user && ["OWNER", "ADMIN"].includes(user.role)) {
      fetchConversations();
      fetchSuggestions();
    }
  }, [user, isOpen, fetchConversations, fetchSuggestions]);

  // Select a conversation
  const selectConversation = useCallback(async (conversationId) => {
    setIsLoading(true);
    const res = await getCopilotConversation(conversationId);
    setIsLoading(false);

    if (res.success && res.data) {
      setActiveConversation(res.data);
      setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
    }
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async (title = "New Conversation") => {
    setIsLoading(true);
    const res = await createCopilotConversation(title);
    setIsLoading(false);

    if (res.success && res.data) {
      setConversations((prev) => [res.data, ...prev]);
      setActiveConversation(res.data);
      setMessages([]);
      return res.data;
    }
    return null;
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId) => {
    const res = await deleteCopilotConversation(conversationId);
    if (res.success) {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    }
  }, [activeConversation]);

  // Pin/archive conversation
  const updateConversation = useCallback(async (conversationId, data) => {
    const res = await updateCopilotConversation(conversationId, data);
    if (res.success && res.data) {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? res.data : c))
      );
      if (activeConversation?.id === conversationId) {
        setActiveConversation(res.data);
      }
    }
  }, [activeConversation]);

  // Send a message
  const sendMessage = useCallback(async (content, context = {}) => {
    setIsLoading(true);
    const res = await sendCopilotMessage(
      activeConversation?.id,
      content,
      context
    );
    setIsLoading(false);

    if (res.success && res.data) {
      // Unwrap the server response - server returns {success, message, data}
      // so res.data.data contains the actual copilot response
      const copilotData = res.data.data || res.data;

      // Update conversation if it was created
      if (copilotData.conversationId && !activeConversation) {
        setActiveConversation({ id: copilotData.conversationId, title: "New Conversation" });
        fetchConversations();
      }

      // Add messages
      const assistantContent = copilotData.assistantMessage?.content || "I'm sorry, I couldn't process that.";
      const assistantAction = copilotData.assistantMessage?.action || null;
      const assistantEntities = copilotData.assistantMessage?.entities || [];

      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "user", content, createdAt: new Date() },
        {
          id: Date.now() + 1,
          role: "assistant",
          content: assistantContent,
          action: assistantAction,
          entities: assistantEntities,
          createdAt: new Date(),
        },
      ]);
    } else {
      // Show error message
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "user", content, createdAt: new Date() },
        {
          id: Date.now() + 1,
          role: "assistant",
          content: res.error || "I'm sorry, I couldn't process that. Please try again.",
          createdAt: new Date(),
        },
      ]);
    }

    return res;
  }, [activeConversation, fetchConversations]);

  // UI actions
  const openCopilot = useCallback(() => setIsOpen(true), []);
  const closeCopilot = useCallback(() => setIsOpen(false), []);
  const toggleCopilot = useCallback(() => setIsOpen((prev) => !prev), []);

  // Clear current conversation
  const clearConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
  }, []);

  const value = {
    // State
    isOpen,
    activeConversation,
    conversations,
    messages,
    isLoading,
    suggestions,
    // Actions
    openCopilot,
    closeCopilot,
    toggleCopilot,
    sendMessage,
    selectConversation,
    createConversation,
    deleteConversation,
    updateConversation,
    clearConversation,
    fetchConversations,
  };

  return (
    <CopilotContext.Provider value={value}>
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot() {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error("useCopilot must be used within a CopilotProvider");
  }
  return context;
}