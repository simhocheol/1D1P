import React,{useState} from 'react';
import {Button} from '@heroui/react';
import {CalendarDays,FileText,ListFilter,Settings,Star} from 'lucide-react';
import Universe from './universe.jsx';
import SignalReport from './signal-report.jsx';
import CalendarPage from './calendar.jsx';
import VerifiedReport from './verified-report.jsx';
import OfficialFeed from './official-feed.jsx';
import ApiSettingsContent from './api-settings.jsx';
import CredentialStore from './credential-store.jsx';
function ApiSettings(){return <CredentialStore><ApiSettingsContent/></CredentialStore>}
import {verifiedSessions,auditSources} from './verified-sessions.js';
import './service.css';
const routes=[['/','시장 캘린더',CalendarDays],['/report','일일 리포트',FileText],['/universe','종목·ETF',ListFilter],['/settings','수집 상태',Settings]];
const latest=Object.keys(verifiedSessions).sort().at(-1);
function CollectionStatus(){return <main className="service-page"><div className="service-heading"><span>DATA CONNECTIONS</span><h1>수집 상태</h1><p>공식 자료와 API 연결 설정</p></div><ApiSettings/><OfficialFeed statusOnly/><section><h2>자동 수집 · 배포</h2><p>GitHub Actions가 미국 동부 09시·17시의 예약 실행 구간에서 공식 RSS를 수집합니다. 서머타임은 America/New_York 기준으로 처리합니다. 실행 지연이 있을 수 있으며 휴장일에도 평일 수집합니다.</p><p>수집된 기록은 저장소에 보관됩니다. GitHub 변경은 연결된 Vercel 운영 배포로 반영됩니다. 일부 수집 실패 시 기존 기록을 유지하고 실패 상태를 공개합니다.</p><h2>미연결</h2><p>S&P 500 구성 종목·주요 ETF 일봉은 Alpaca IEX로 수집하며 시세 원문은 관리자 전용 파일에 보관합니다. 기관 원문 자동 분석, OpenAI 요약, 실적 일정 전수 수집, 웹·모바일 푸시는 아직 미연결입니다.</p></section></main>}
export default function Service(){const path=location.pathname==='/dashboard.html'?'/':location.pathname;const route=routes.some(r=>r[0]===path)?path:'/';const date=new URLSearchParams(location.search).get('date')||latest;return <div className="service-shell"><header className="service-header"><a className="service-brand" href="/">1D1P<span>하루에 1퍼센트 먹기</span></a><nav aria-label="1D1P 메뉴">{routes.map(([href,label,Icon])=><a href={href} aria-current={route===href?'page':undefined} key={href}><Icon size={15}/><span>{label}</span></a>)}</nav><span className="service-mode">공식 자료 · 검증 기록</span></header><div className="service-content">{route==='/report'?<><SignalReport/><details className="service-page"><summary>과거 수동 검증 기록</summary><VerifiedReport date={date}/><OfficialFeed date={date}/></details></>:route==='/universe'?<Universe/>:route==='/settings'?<CollectionStatus/>:<CalendarPage/>}</div><div className="service-disclaimer">1D1P는 시장 관찰·근거 추적 서비스입니다. 이름은 목표 표현이며 일일 1% 수익을 보장하지 않습니다.</div></div>}
