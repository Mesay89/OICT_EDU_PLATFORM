import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, FlatList, TextInput, TouchableOpacity,
  View as RNView, KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl
} from 'react-native';
import { Text } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Send, MessageSquare, Users } from 'lucide-react-native';
import apiClient from '@/api/client';

const TINT = '#6366f1';

const ROOMS = [
  { id: 'general', label: '# General', desc: 'Open discussion for everyone' },
  { id: 'programming', label: '# Programming', desc: 'Code questions & tips' },
  { id: 'design', label: '# Design', desc: 'UI/UX and visual design' },
  { id: 'business', label: '# Business', desc: 'Entrepreneurship & careers' },
];

function MessageBubble({ msg, isOwn }) {
  return (
    <RNView style={[styles.bubbleWrap, isOwn && styles.bubbleWrapOwn]}>
      {!isOwn && (
        <RNView style={styles.avatar}>
          <Text style={styles.avatarText}>{msg.sender?.name?.charAt(0) || '?'}</Text>
        </RNView>
      )}
      <RNView style={[styles.bubble, isOwn && styles.bubbleOwn]}>
        {!isOwn && <Text style={styles.senderName}>{msg.sender?.name || 'User'}</Text>}
        <Text style={[styles.msgText, isOwn && styles.msgTextOwn]}>{msg.content}</Text>
        <Text style={[styles.msgTime, isOwn && styles.msgTimeOwn]}>
          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </RNView>
    </RNView>
  );
}

export default function ChatScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeRoom, setActiveRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const { data } = await apiClient.get(`/messages/${activeRoom}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [activeRoom]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending || !user) return;
    setSending(true);
    const optimistic = {
      _id: Date.now().toString(),
      content: input.trim(),
      sender: { _id: user._id, name: user.name },
      createdAt: new Date().toISOString(),
      room: activeRoom,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    try {
      await apiClient.post('/messages', { content: optimistic.content, room: activeRoom });
      fetchMessages();
    } catch {}
    finally { setSending(false); }
  };

  if (!user) {
    return (
      <RNView style={styles.authPrompt}>
        <MessageSquare size={56} color="#d1d5db" />
        <Text style={styles.authTitle}>Join the Conversation</Text>
        <Text style={styles.authMsg}>Sign in to access community chat rooms.</Text>
        <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/login')}>
          <Text style={styles.authBtnText}>Sign In</Text>
        </TouchableOpacity>
      </RNView>
    );
  }

  return (
    <RNView style={styles.container}>
      {/* Room Tabs */}
      <RNView style={styles.roomsBar}>
        <FlatList
          data={ROOMS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={r => r.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.roomTab, activeRoom === item.id && styles.roomTabActive]}
              onPress={() => setActiveRoom(item.id)}
            >
              <Text style={[styles.roomTabText, activeRoom === item.id && styles.roomTabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        />
      </RNView>

      {/* Room Info */}
      <RNView style={styles.roomInfo}>
        <Users size={14} color="#9ca3af" />
        <Text style={styles.roomInfoText}>
          {ROOMS.find(r => r.id === activeRoom)?.desc}
        </Text>
      </RNView>

      {/* Messages */}
      {loading ? (
        <RNView style={styles.centered}>
          <ActivityIndicator size="large" color={TINT} />
        </RNView>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m._id?.toString()}
          renderItem={({ item }) => (
            <MessageBubble
              msg={item}
              isOwn={item.sender?._id === user._id || item.sender === user._id}
            />
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMessages(); }} tintColor={TINT} />
          }
          ListEmptyComponent={
            <RNView style={styles.emptyChat}>
              <MessageSquare size={40} color="#d1d5db" />
              <Text style={styles.emptyChatText}>No messages yet. Start the conversation!</Text>
            </RNView>
          }
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <RNView style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder={`Message #${activeRoom}...`}
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Send size={18} color="#fff" />
            }
          </TouchableOpacity>
        </RNView>
      </KeyboardAvoidingView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 14, backgroundColor: '#f9fafb' },
  authTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  authMsg: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  authBtn: { backgroundColor: TINT, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  authBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  // Room tabs
  roomsBar: {
    backgroundColor: '#fff', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  roomTab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#e5e7eb', marginRight: 8,
  },
  roomTabActive: { backgroundColor: TINT, borderColor: TINT },
  roomTabText: { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  roomTabTextActive: { color: '#fff' },
  roomInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  roomInfoText: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  // Messages
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyChatText: { color: '#9ca3af', fontWeight: '600', textAlign: 'center' },
  // Bubbles
  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  bubbleWrapOwn: { flexDirection: 'row-reverse' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: TINT, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  bubble: {
    maxWidth: '75%', backgroundColor: '#fff', borderRadius: 18,
    borderBottomLeftRadius: 4, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  bubbleOwn: { backgroundColor: TINT, borderBottomLeftRadius: 18, borderBottomRightRadius: 4 },
  senderName: { fontSize: 11, fontWeight: '800', color: TINT, marginBottom: 3 },
  msgText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  msgTextOwn: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#d1d5db', marginTop: 4, textAlign: 'right' },
  msgTimeOwn: { color: 'rgba(255,255,255,0.6)' },
  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  textInput: {
    flex: 1, minHeight: 44, maxHeight: 100,
    backgroundColor: '#f3f4f6', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#111827',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: TINT,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#e5e7eb' },
});
