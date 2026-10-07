import React from 'react';
import {Modal} from '@heroui/react';
import {DriverIcon} from './driver-icons.jsx';
import {drivers} from './framework.js';
const driverName=id=>drivers.find(d=>d.id===id)?.name||id;
export function DriverTags({ids=[]}){return <span className="home-drivers">{ids.map(d=><span key={d}><DriverIcon id={d} size={11}/>{driverName(d)}</span>)}</span>}
// Shared detail modal for home cards: title, optional badge, then free content.
export default function InfoModal({open,onClose,title,badge,children}){
 return <Modal><Modal.Backdrop isOpen={!!open} onOpenChange={o=>{if(!o)onClose()}}><Modal.Container><Modal.Dialog className="info-modal">{open&&<><Modal.CloseTrigger/><Modal.Header><div className="info-modal-head"><Modal.Heading>{title}</Modal.Heading>{badge}</div></Modal.Header><Modal.Body>{children}<p className="fine">투자 권유가 아닌 관측 기록입니다.</p></Modal.Body></>}</Modal.Dialog></Modal.Container></Modal.Backdrop></Modal>;
}
export function Section({title,children}){return <section className="info-section">{title&&<h4>{title}</h4>}{children}</section>}
