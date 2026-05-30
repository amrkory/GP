import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';
import { ChatService }  from '../../../core/services/chat.service';

@Component({
  selector: 'app-messages-inbox',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="page">
  <div class="ph">
    <h1>Messages</h1>
    <span class="badge" *ngIf="unread()>0">{{ unread() }}</span>
  </div>

  <div class="sk-list" *ngIf="loading()">
    <div class="sk-row" *ngFor="let i of [1,2,3]">
      <div class="sk-av"></div>
      <div class="sk-lines"><div class="sk-l w50"></div><div class="sk-l w70"></div></div>
    </div>
  </div>

  <div class="empty" *ngIf="!loading() && list().length===0">
    <div class="eico"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
    <p>No conversations yet</p>
    <p class="esub">Book an appointment to message your doctor</p>
  </div>

  <div class="clist" *ngIf="!loading() && list().length>0">
    <a class="crow" *ngFor="let c of list()" [routerLink]="['/patient/messages', c.id]">
      <div class="av" [style.background]="clr(c.name)">{{ ini(c.name) }}</div>
      <div class="ci">
        <div class="ctop">
          <span class="cname">Dr. {{ c.name }}</span>
          <span class="ctime">{{ fmtTime(c.at) }}</span>
        </div>
        <div class="cbot">
          <span class="clast" [class.unread]="c.unread>0">{{ c.last || 'Start a conversation' }}</span>
          <span class="ubadge" *ngIf="c.unread>0">{{ c.unread }}</span>
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </a>
  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:20px;max-width:680px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:0;}}
    .ph{display:flex;align-items:center;gap:10px;padding:0 0 14px;margin:0 20px;}
    @media(max-width:768px){.ph{padding:16px 16px 12px;margin:0;}}
    h1{font-size:20px;font-weight:800;color:#111;}
    .badge{background:#D84040;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;}
    @keyframes p{0%,100%{opacity:1;}50%{opacity:.4;}}
    .sk-list{display:flex;flex-direction:column;gap:2px;}
    .sk-row{display:flex;align-items:center;gap:12px;padding:14px 20px;}
    @media(max-width:768px){.sk-row{padding:14px 16px;}}
    .sk-av{width:46px;height:46px;border-radius:50%;background:#F0F2F5;flex-shrink:0;animation:p 1.4s ease-in-out infinite;}
    .sk-lines{flex:1;display:flex;flex-direction:column;gap:7px;}
    .sk-l{height:11px;border-radius:6px;background:#F0F2F5;animation:p 1.4s ease-in-out infinite;}
    .sk-l.w50{width:50%;}.sk-l.w70{width:70%;}
    .empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:48px;text-align:center;}
    .eico{width:60px;height:60px;background:#F4F6FA;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    .empty p{font-size:14px;color:#9CA3AF;}.esub{font-size:12px;color:#C9CDD4;}
    .clist{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.05);}
    @media(max-width:768px){.clist{border-radius:0;}}
    .crow{display:flex;align-items:center;gap:12px;padding:13px 18px;border-bottom:1px solid #F8F9FC;text-decoration:none;color:inherit;transition:background .1s;}
    .crow:last-child{border-bottom:none;}.crow:hover{background:#F8F9FC;}
    .av{width:46px;height:46px;border-radius:50%;color:#fff;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .ci{flex:1;min-width:0;}
    .ctop{display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;}
    .cname{font-size:15px;font-weight:600;color:#111;}
    .ctime{font-size:11px;color:#9CA3AF;}
    .cbot{display:flex;align-items:center;justify-content:space-between;gap:8px;}
    .clast{font-size:13px;color:#6B7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;}
    .clast.unread{color:#111;font-weight:600;}
    .ubadge{background:#D84040;color:#fff;font-size:11px;font-weight:700;min-width:20px;height:20px;border-radius:10px;display:flex;align-items:center;justify-content:center;padding:0 5px;flex-shrink:0;}
  `]
})
export class MessagesInboxComponent implements OnInit {
  private svc = inject(ChatService);
  loading = signal(true);
  list    = signal<{id:string;name:string;last:string;at:string;unread:number}[]>([]);
  unread(): number { return this.list().reduce((s,c)=>s+(c.unread||0),0); }

  ngOnInit(): void {
    this.svc.getConversations().subscribe({
      next: (res:any) => {
        const raw:any[] = Array.isArray(res)?res:res?.data?.items??res?.data??[];
        this.list.set(raw.map((c:any)=>({
          id:     c.participantId??c.otherUserId??c.userId??c.id??'',
          name:   c.participantName??c.otherUserName??c.userName??c.name??'Doctor',
          last:   typeof c.lastMessage==='string'?c.lastMessage
                  :(c.lastMessage as any)?.body??(c.lastMessage as any)?.content
                  ??c.lastMessageContent??'',
          at:     c.lastMessageAt??c.lastSentAt??c.sentAt??'',
          unread: c.unreadCount??c.unread??0,
        })));
        this.loading.set(false);
      },
      error:()=>this.loading.set(false)
    });
  }

  private C=['#2D4A8A','#0F6E56','#D84040','#7C3AED','#0891B2'];
  clr(n:string){return this.C[(n?.charCodeAt(0)||0)%this.C.length];}
  ini(n:string){const p=(n||'').trim().split(' ');return((p[0]?.[0]??'')+(p[1]?.[0]??'')).toUpperCase()||'?';}
  fmtTime(iso:string){
    if(!iso)return'';
    const d=new Date(iso),now=new Date(),diff=now.getTime()-d.getTime();
    if(diff<60000)return'now';
    if(diff<3600000)return Math.floor(diff/60000)+'m';
    if(diff<86400000)return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    if(diff<604800000)return d.toLocaleDateString([],{weekday:'short'});
    return d.toLocaleDateString([],{month:'short',day:'numeric'});
  }
}
