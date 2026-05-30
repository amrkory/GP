import { Injectable, OnDestroy, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import * as signalR from '@microsoft/signalr';

@Injectable({ providedIn: 'root' })
export class SignalRService implements OnDestroy {
  private conn: signalR.HubConnection | null = null;
  readonly connected = signal(false);

  private _msg$     = new Subject<any>();
  private _read$    = new Subject<string>();
  private _online$  = new Subject<string>();
  private _offline$ = new Subject<string>();

  readonly message$    = this._msg$.asObservable();
  readonly read$out    = this._read$.asObservable();
  readonly online$out  = this._online$.asObservable();
  readonly offline$out = this._offline$.asObservable();

  // Backward-compat aliases
  get messagesRead$()      { return this.read$out; }
  async startConnection()  { return this.start(); }
  async stopConnection()   { return this.stop(); }
  markAsRead(id: string)   { this.markRead(id); }
  isOnline(_: string)      { return false; }
  sendMessage(r: string, c: string) { this.sendMsg(r, c); }

  constructor(private auth: AuthService) {}

  async start(): Promise<void> {
    if (this.conn?.state === signalR.HubConnectionState.Connected) return;

    this.conn = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.socketUrl}/hubs/chat`, {
        accessTokenFactory: () => this.auth.getAccessToken() ?? '',
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Exact event names from Flutter backend
    this.conn.on('ReceiveMessage', (msg: any) => {
      console.log('[SignalR] ReceiveMessage:', JSON.stringify(msg));
      this._msg$.next(msg);
    });
    this.conn.on('MessagesRead',  (uid: string) => this._read$.next(uid));
    this.conn.on('UserOnline',    (uid: string) => this._online$.next(uid));
    this.conn.on('UserOffline',   (uid: string) => this._offline$.next(uid));
    this.conn.onreconnected(() => this.connected.set(true));
    this.conn.onclose(()      => this.connected.set(false));

    try {
      await this.conn.start();
      this.connected.set(true);
      console.log('[SignalR] Connected ✓');
    } catch (e) {
      console.error('[SignalR] Failed:', e);
    }
  }

  async stop(): Promise<void> {
    await this.conn?.stop();
    this.connected.set(false);
  }

  // Exact invoke from Flutter: args: [{"receiverId": ..., "messageContent": ...}]
  sendMsg(receiverId: string, messageContent: string): void {
    if (this.conn?.state !== signalR.HubConnectionState.Connected) {
      console.error('[SignalR] Not connected');
      return;
    }
    this.conn.invoke('SendMessage', { receiverId, messageContent })
      .catch((e: any) => console.error('[SignalR] SendMessage error:', e));
  }

  // Exact invoke from Flutter: args: [otherUserId]
  markRead(otherUserId: string): void {
    if (this.conn?.state === signalR.HubConnectionState.Connected) {
      this.conn.invoke('MarkAsRead', otherUserId)
        .catch((e: any) => console.error('[SignalR] MarkAsRead error:', e));
    }
  }

  ngOnDestroy(): void {
    this.stop();
    [this._msg$, this._read$, this._online$, this._offline$].forEach(s => s.complete());
  }
}
