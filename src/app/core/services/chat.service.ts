/**
 * chat.service.ts — Wateen Health
 *
 * Real REST endpoints (Swagger):
 *   GET /api/Chat                          → conversation list (paged)
 *   GET /api/Chat/{otherUserId}/history    → message history
 *   PUT /api/Chat/{otherUserId}/read       → mark as read
 *
 * Real-time: SignalR hub at /hubs/chat
 *   Invoke  → SendMessage({ receiverId, messageContent })
 *   Invoke  → MarkAsRead(otherUserId)
 *   Listen  → ReceiveMessage(msg)
 *   Listen  → MessagesRead(userId)
 *   Listen  → UserOnline(userId)
 *   Listen  → UserOffline(userId)
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Normalised conversation row used across all inbox components */
export interface ConvRow {
  userId:  string;   // the other person's userId
  name:    string;   // display name
  lastMsg: string;   // last message text
  lastAt:  string;   // ISO datetime of last message
  unread:  number;   // unread count
}

/** Normalised chat message used across all room components */
export interface ChatMsg {
  id:         string;
  senderId:   string;
  receiverId: string;
  body:       string;   // message text — always populated
  sentAt:     string;   // ISO datetime
  isRead:     boolean;
}

/** Parse any raw backend message shape into ChatMsg */
export function toMsg(raw: any): ChatMsg {
  return {
    id:         raw.id ?? raw.messageId ?? `${Date.now()}-${Math.random()}`,
    senderId:   raw.senderId   ?? raw.sender?.id   ?? '',
    receiverId: raw.receiverId ?? raw.receiver?.id ?? '',
    // The backend sends messageContent via SignalR, body via REST history
    body:       raw.body ?? raw.content ?? raw.messageContent ?? raw.text ?? '',
    sentAt:     raw.sentAt ?? raw.createdAt ?? new Date().toISOString(),
    isRead:     raw.isRead ?? false,
  };
}

/** Parse any raw backend conversation shape into ConvRow */
export function toConvRow(raw: any): ConvRow {
  return {
    userId:  raw.participantId  ?? raw.otherUserId ?? raw.userId ?? raw.id ?? '',
    name:    raw.participantName ?? raw.otherUserName ?? raw.userName ?? raw.name ?? '',
    lastMsg: typeof raw.lastMessage === 'string'
               ? raw.lastMessage
               : raw.lastMessage?.body ?? raw.lastMessage?.messageContent ?? raw.lastMessageContent ?? '',
    lastAt:  raw.lastMessageAt ?? raw.lastSentAt ?? raw.sentAt ?? '',
    unread:  raw.unreadCount ?? raw.unread ?? 0,
  };
}

/** Normalise any response shape to an array */
export function toArr(res: any): any[] {
  if (Array.isArray(res))              return res;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.data))        return res.data;
  return [];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/Chat
   * Returns a paged list of conversations for the logged-in user.
   */
  getConversations(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get<any>(`${this.api}/Chat`, {
      params: { pageNumber: String(pageNumber), pageSize: String(pageSize) }
    }).pipe(catchError(() => of([])));
  }

  /**
   * GET /api/Chat/{otherUserId}/history
   * Returns all messages between the logged-in user and otherUserId.
   */
  getHistory(otherUserId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/Chat/${otherUserId}/history`)
      .pipe(catchError(() => of([])));
  }

  /**
   * PUT /api/Chat/{otherUserId}/read
   * Marks all messages from otherUserId as read.
   */
  markRead(otherUserId: string): Observable<any> {
    return this.http.put<any>(`${this.api}/Chat/${otherUserId}/read`, {})
      .pipe(catchError(() => of(null)));
  }

  // ── Aliases kept for any old call sites ──────────────────────────────────
  inbox     = (p = 1, s = 50) => this.getConversations(p, s);
  history   = (id: string)    => this.getHistory(id);
}
