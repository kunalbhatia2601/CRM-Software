"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
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

  // Always-fresh id of the current conversation (avoids stale closures in sendMessage).
  const activeIdRef = useRef(null);
  useEffect(() => { activeIdRef.current = activeConversation?.id || null; }, [activeConversation]);

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
      // Flatten stored contextData (action/entities/isError) onto each message.
      const msgs = Array.isArray(res.data.messages) ? res.data.messages : [];
      setMessages(msgs.map((m) => ({
        ...m,
        action: m.contextData?.action || null,
        entities: m.contextData?.entities || [],
        isError: !!m.contextData?.isError,
      })));
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
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
      // Refetch to keep the list in sync.
      fetchConversations();
    }
  }, [activeConversation, fetchConversations]);

  // Rename / pin / archive conversation
  const updateConversation = useCallback(async (conversationId, data) => {
    const res = await updateCopilotConversation(conversationId, data);
    if (res.success && res.data) {
      if (activeConversation?.id === conversationId) {
        setActiveConversation(res.data);
      }
      // Refetch so pin ordering / titles / archive state refresh properly.
      fetchConversations();
    }
  }, [activeConversation, fetchConversations]);

  // Send a message
  const sendMessage = useCallback(async (content, context = {}) => {
    // Optimistically show the user's message right away.
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content, createdAt: new Date() },
    ]);
    setIsLoading(true);

    const res = await sendCopilotMessage(
      activeIdRef.current,
      content,
      context
    );
    setIsLoading(false);

    if (res.success && res.data) {
      const copilotData = res.data.data || res.data;

      // Bind to the conversation the server used (created or existing).
      if (copilotData.conversationId && copilotData.conversationId !== activeIdRef.current) {
        activeIdRef.current = copilotData.conversationId;
        setActiveConversation((prev) =>
          prev?.id === copilotData.conversationId ? prev : { id: copilotData.conversationId, title: "New Conversation" }
        );
        fetchConversations();
      }

      const am = copilotData.assistantMessage || {};
      const assistantContent = am.content || "I'm sorry, I couldn't process that.";

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: assistantContent,
          action: am.action || null,
          entities: am.entities || [],
          isError: !!am.isError,
          failedPrompt: am.isError ? content : undefined,
          createdAt: new Date(),
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          isError: true,
          failedPrompt: content,
          content: res.error || "Something went wrong. Please try again.",
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