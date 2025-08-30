// Copyright Mark Skiba, 2025 All rights reserved

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useSupabase } from '../context/SupabaseContext';
import { IonList, IonItem, IonLabel, IonSpinner } from '@ionic/react';

interface Message {
  id: string;
  user_id: string;
  role: 'user' | 'agent';
  content: string;
  created_at: string;
}

const ChatHistory: React.FC = () => {
  const { user, loading } = useSupabase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }
    setLoadingMessages(true);
    supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setMessages(data as Message[]);
        setLoadingMessages(false);
      });
    // Optionally: subscribe to new messages in real-time
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading || loadingMessages) return <IonSpinner />;
  if (!user) return <IonLabel>Login to view chat history.</IonLabel>;
  if (!messages.length) return <IonLabel>No chat history yet.</IonLabel>;

  return (
    <IonList>
      {messages.map((msg) => (
        <IonItem key={msg.id} color={msg.role === 'user' ? 'primary' : 'light'}>
          <IonLabel>
            <strong>{msg.role === 'user' ? 'You' : 'Agent'}:</strong> {msg.content}
          </IonLabel>
        </IonItem>
      ))}
    </IonList>
  );
};

export default ChatHistory;
