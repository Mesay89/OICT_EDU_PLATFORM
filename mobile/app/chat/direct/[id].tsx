import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, FlatList, TextInput, TouchableOpacity,
  View as RNView, KeyboardAvoidingView, Platform,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Text } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Send, MessageCircle, ChevronLeft, User as UserIcon } from 'lucide-react-native';
import apiClient from '@/api/client';

const TINT = '#6366f1';

interface Participant {
  _id: string;
  name: string;
  email?: string;
}

interface Message {
  _id: string;
  sender: Participant | string;
  content: string;
  createdAt: string;
  read?: boolean;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  lastMessage?: Message;
  updatedAt?: string;
}

function getSenderId(sender: Participant | string): string {
  if (typeof sender === 'string') return sender;
  return sender?._id || '';
}

function getSenderName(sender: Participant | string): string {
  if (typeof sender === 'string') return '?';
  return sender?.name || 'User';
}

function MessageBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  return (
    <RNView style={[styles.bubbleWrap, isOwn && styles.bubbleWrapOwn]}>
      {!isOwn && (
        <RNView style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getSenderName(msg.sender).charAt(0).toUpperCase()}
          </Text>
        </RNView>
      )}
      <RNView style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && (
          <Text style={styles.senderName}>{getSenderName(msg.sender)}</Text>
        )}
        <Text style={[styles.msgText, isOwn && styles.msgTextOwn]}>
          {msg.content}
        </Text>
        <Text style={[styles.msgTime, isOwn && styles.msgTimeOwn]}>
          {msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
        </Text>
      </RNView>
    </RNView>
  );
}

export default function DirectMessageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const flatRef = useRef<FlatList>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<Participant | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Find the conversation that includes the target userId
  const findConversation = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/messages/conversations');
      const conversations: Conversation[] = Array.isArray(data) ? data : [];

      const convo = conversations.find((c) =>
        c.participants.some(
          (p) => (typeof p === 'string' ? p : p._id) === id
        )
      );

      if (convo) {
        setConversationId(convo._id);

        // Find the other participant's info
        const other = convo.participants.find(
          (p) => (typeof p === 'string' ? p : p._id) === id
        );
        if (other && typeof other !== 'string') {
          setOtherUser(other);
        }

        return convo._id;
      }

      return null;
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      return null;
    }
  }, [id]);

  // Load messages for the conversation
  const fetchMessages = useCallback(async (convoId?: string | null) => {
    const targetId = convoId || conversationId;
    if (!targetId) return;

    try {
      const { data } = await apiClient.get(`/messages/${targetId}`);
      const msgs = Array.isArray(data) ? data : (data?.messages || []);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [conversationId]);

  // Mark messages as read
  const markAsRead = useCallback(async (convoId?: string | null) => {
    const targetId = convoId || conversationId;
    if (!targetId) return;

    try {
      await apiClient.put(`/messages/${targetId}/read`);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [conversationId]);

  // Initialize: find conversation, load messages, mark as read
  useEffect(() => {
    if (!user || !id) {
      setLoading(false);
      return;
    }

    let intervalId: ReturnType<typeof setInterval>;

    const init = async () => {
      setLoading(true);
      const convoId = await findConversation();
      if (convoId) {
        await fetchMessages(convoId);
        await markAsRead(convoId);

        // Poll for new messages every 5 seconds
        intervalId = setInterval(() => fetchMessages(convoId), 5000);
      } else {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, id]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending || !user || !id) return;
    setSending(true);

    const content = input.trim();

    // Optimistic message
    const optimistic: Message = {
      _id: `temp-${Date.now()}`,
      content,
      sender: { _id: user._id, name: user.name },
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');

    try {
      await apiClient.post('/messages', {
        recipientId: id,
        content,
      });

      // Reload the conversation to get the real message and conversationId
      const convoId = await findConversation();
      if (convoId) {
        await fetchMessages(convoId);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const convoId = await findConversation();
    if (convoId) {
      await fetchMessages(convoId);
      await markAsRead(convoId);
    } else {
      setRefreshing(false);
    }
  };

  const headerTitle = otherUser?.name
    ? `${otherUser.name}`
    : 'Direct Message';

  const bgColor = isDarkMode ? '#09090b' : '#f9fafb';
  const headerBg = isDarkMode ? '#18181b' : '#fff';
  const borderColor = isDarkMode ? '#27272a' : '#f3f4f6';
  const inputBg = isDarkMode ? '#27272a' : '#f3f4f6';
  const inputColor = isDarkMode ? '#f8fafc' : '#111827';
  const placeholderColor = isDarkMode ? '#71717a' : '#9ca3af';

  // Not signed in
  if (!user) {
    return (
      <RNView style={[styles.authPrompt, { backgroundColor: bgColor }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <MessageCircle size={56} color="#d1d5db" />
        <Text style={[styles.authTitle, { color: isDarkMode ? '#fff' : '#111827' }]}>
          Sign In Required
        </Text>
        <Text style={styles.authMsg}>
          Please sign in to send direct messages.
        </Text>
        <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/login')}>
          <Text style={styles.authBtnText}>Sign In</Text>
        </TouchableOpacity>
      </RNView>
    );
  }

  return (
    <RNView style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <RNView
        style={[
          styles.header,
          {
            backgroundColor: headerBg,
            borderBottomColor: borderColor,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={isDarkMode ? '#fff' : '#111827'} />
        </TouchableOpacity>

        <RNView style={styles.headerCenter}>
          <RNView style={styles.headerAvatar}>
            <UserIcon size={18} color="#fff" />
          </RNView>
          <RNView>
            <Text
              style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#111827' }]}
              numberOfLines={1}
            >
              {headerTitle}
            </Text>
            <Text style={styles.headerSubtitle}>Direct Message</Text>
          </RNView>
        </RNView>

        <RNView style={{ width: 40 }} />
      </RNView>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <RNView style={styles.centered}>
            <ActivityIndicator size="large" color={TINT} />
            <Text style={[styles.loadingText, { color: isDarkMode ? '#a1a1aa' : '#9ca3af' }]}>
              Loading messages...
            </Text>
          </RNView>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(m) => m._id?.toString()}
            renderItem={({ item }) => (
              <MessageBubble
                msg={item}
                isOwn={getSenderId(item.sender) === user._id}
              />
            )}
            contentContainerStyle={[
              styles.messageList,
              messages.length === 0 && styles.emptyListContainer,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={TINT}
              />
            }
            ListEmptyComponent={
              <RNView style={styles.emptyChat}>
                <RNView style={[styles.emptyIconBox, { backgroundColor: isDarkMode ? '#18181b' : '#fff' }]}>
                  <MessageCircle size={40} color="#d1d5db" />
                </RNView>
                <Text style={[styles.emptyChatTitle, { color: isDarkMode ? '#fff' : '#111827' }]}>
                  No messages yet
                </Text>
                <Text style={styles.emptyChatText}>
                  Send a message to start the conversation!
                </Text>
              </RNView>
            }
            onContentSizeChange={() =>
              flatRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Input Bar */}
        <RNView
          style={[
            styles.inputBar,
            {
              backgroundColor: headerBg,
              borderTopColor: borderColor,
            },
          ]}
        >
          <TextInput
            style={[styles.textInput, { backgroundColor: inputBg, color: inputColor }]}
            placeholder="Type a message..."
            placeholderTextColor={placeholderColor}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || sending) && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </RNView>
      </KeyboardAvoidingView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  // Auth prompt
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 14,
  },
  authTitle: { fontSize: 22, fontWeight: '900' },
  authMsg: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  authBtn: {
    backgroundColor: TINT,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  authBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  // Header
  header: {
    height: Platform.OS === 'ios' ? 100 : 80,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerSubtitle: { fontSize: 11, color: '#9ca3af', fontWeight: '600', marginTop: 1 },
  // Loading
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  // Messages
  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  emptyListContainer: { flex: 1 },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  emptyChatText: {
    color: '#9ca3af',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  // Bubbles
  bubbleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  bubbleWrapOwn: { flexDirection: 'row-reverse' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#a5b4fc',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleOwn: {
    backgroundColor: TINT,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#e5e7eb',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 3,
  },
  msgText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  msgTextOwn: { color: '#fff' },
  msgTime: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },
  msgTimeOwn: { color: 'rgba(255,255,255,0.6)' },
  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#c7d2fe' },
});
