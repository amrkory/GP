import { Injectable, OnDestroy, signal } from '@angular/core';
import { Subject }                        from 'rxjs';
import { AuthService }                    from './auth.service';
import { environment }                    from '../../../environments/environment';
import { Notification, ChatMessage, Appointment } from '../models/api.models';

// NOTE: Run  npm install @microsoft/signalr  then uncomment the import below.
// import * as signalR from '@microsoft/signalr';

// Placeholder so the project compiles before the package is installed
declare const signalR: any;

@Injectable({ providedIn: 'root' })
export class SignalRService implements OnDestroy {

  private connection: any = null;
  readonly connected = signal(false);

  private msg$  = new Subject<ChatMessage>();
  private notif$ = new Subject<Notification>();
  private appt$  = new Subject<Appointment>();

  readonly message$     = this.msg$.asObservable();
  readonly notification$ = this.notif$.asObservable();
  readonly appointment$  = this.appt$.asObservable();

  constructor(private auth: AuthService) {}

  async startConnection(): Promise<void> {
    if (typeof signalR === 'undefined') {
      console.warn('[SignalR] @microsoft/signalr not installed yet. Run: npm install @microsoft/signalr');
      return;
    }
    if (this.connection?.state === signalR.HubConnectionState.Connected) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.socketUrl}/hubs/wateen`, {
        accessTokenFactory: () => this.auth.getAccessToken() ?? '',
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveMessage',      (m: ChatMessage)   => this.msg$.next(m));
    this.connection.on('ReceiveNotification', (n: Notification)  => this.notif$.next(n));
    this.connection.on('AppointmentUpdated',  (a: Appointment)   => this.appt$.next(a));

    this.connection.onreconnected(() => this.connected.set(true));
    this.connection.onclose(()      => this.connected.set(false));

    try {
      await this.connection.start();
      this.connected.set(true);
    } catch (e) { console.error('[SignalR]', e); }
  }

  async stopConnection(): Promise<void> {
    if (this.connection) { await this.connection.stop(); this.connected.set(false); }
  }

  send(method: string, ...args: any[]) {
    if (this.connection?.state === signalR.HubConnectionState?.Connected) {
      this.connection.invoke(method, ...args);
    }
  }

  ngOnDestroy() {
    this.stopConnection();
    [this.msg$, this.notif$, this.appt$].forEach(s => s.complete());
  }
}
