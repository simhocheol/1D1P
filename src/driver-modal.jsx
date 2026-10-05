import React from 'react';
import {Modal} from '@heroui/react';
import {DriverArt} from './driver-icons.jsx';
// Plain-language explanations for readers without an economics background.
export const plain={
 demand:{what:'사람과 기업이 물건·서비스를 얼마나 사는지, 일자리가 늘고 있는지를 봅니다.',why:'많이 사고 많이 고용하면 기업 매출이 늘 거라 기대해 주가가 오르기 쉽습니다.'},
 cost:{what:'기름값·원자재·물가처럼 기업과 가계가 내야 하는 비용을 봅니다.',why:'비용이 오르면 기업이 남기는 돈이 줄고, 금리 인상 걱정도 커집니다.'},
 rates:{what:'돈을 빌릴 때 내는 이자, 특히 미국 국채 금리를 봅니다.',why:'금리가 오르면 대출 부담이 커지고, 미래 이익의 가치가 낮아져 성장주에 불리합니다.'},
 credit:{what:'회사가 돈을 빌리기 쉬운지, 부도 걱정이 커지는지를 봅니다.',why:'빌리기 어려워지면 빚이 많은 기업과 금융회사가 먼저 흔들립니다.'},
 liquidity:{what:'중앙은행이 시장에 푼 돈의 양과 달러 흐름을 봅니다.',why:'시장에 돈이 많으면 주식 같은 위험자산으로 돈이 흘러가기 쉽습니다.'},
 fx:{what:'달러가 다른 나라 돈에 비해 강해지는지 약해지는지를 봅니다.',why:'달러가 강하면 해외에서 돈을 버는 미국 기업의 실적이 줄어 보입니다.'},
 policy:{what:'정부·규제기관의 결정, 관세, 법 변화 같은 정책 뉴스를 봅니다.',why:'규칙이 바뀌면 특정 업종이 갑자기 유리해지거나 불리해집니다.'},
 supply:{what:'공장 가동, 부품 부족, 물류 차질처럼 물건을 만드는 과정을 봅니다.',why:'만들 수 없으면 팔 수도 없고, 부족한 물건은 값이 올라갑니다.'},
 investment:{what:'기업이 공장·데이터센터·AI 같은 곳에 돈을 얼마나 쓰는지 봅니다.',why:'한 회사의 투자는 장비·부품을 파는 다른 회사의 매출이 됩니다.'},
 revenue:{what:'기업이 실제로 번 돈(매출)과 앞으로의 매출 전망을 봅니다.',why:'기대보다 많이 벌면 주가가 오르고, 적게 벌면 내리기 쉽습니다.'},
 margin:{what:'번 돈 중 비용을 빼고 남는 비율(이익률)을 봅니다.',why:'매출이 같아도 남기는 돈이 늘면 회사 가치가 높게 평가됩니다.'},
 capital:{what:'자사주 매입, 배당, 새 주식 발행, 인수합병 같은 회사의 돈 관리 결정을 봅니다.',why:'자사주를 사면 주주에게 유리하고, 새 주식을 찍으면 기존 주주 몫이 줄어듭니다.'},
};
const statusText={observed:'오늘 이 신호가 뚜렷하게 나타났어요.',quiet:'움직임은 있었지만, 의미 있다고 볼 만큼 크지는 않았어요.',unverified:'오늘은 확인할 수 있는 자료가 없었어요.'};
export default function DriverModal({driver,fact,sectors=[],candidateCount=0,sourceCount=0,onFilter,filterActive,onClose,children}){
 const p=driver&&plain[driver.id];
 return <Modal><Modal.Backdrop isOpen={!!driver} onOpenChange={o=>{if(!o)onClose()}}><Modal.Container><Modal.Dialog className="driver-modal">{driver&&<><Modal.CloseTrigger/><Modal.Header><div className="driver-modal-head"><DriverArt id={driver.id} layer={driver.layer}/><div><Modal.Heading>{driver.name}</Modal.Heading><span className={`driver-modal-status ${driver.status}`}>{driver.status==='observed'?'오늘 관측됨':driver.status==='quiet'?'약한 움직임':'자료 없음'}</span></div></div></Modal.Header><Modal.Body>
  <section className="driver-modal-summary"><h4>한눈에 보기</h4><p>{statusText[driver.status]||statusText.unverified}</p>{fact&&<p className="driver-modal-fact">{fact}</p>}<ul><li>근거 자료 <b>{sourceCount}건</b></li><li>영향 받은 업종 <b>{sectors.length?sectors.join(', '):'없음'}</b></li><li>눈여겨볼 종목 <b>{candidateCount}개</b></li></ul></section>
  {p&&<section className="driver-modal-plain"><h4>이게 뭐예요?</h4><p>{p.what}</p><h4>왜 주가에 중요해요?</h4><p>{p.why}</p></section>}
  {children&&<details className="driver-modal-more"><summary>자세한 근거 보기</summary>{children}</details>}
  {onFilter&&<button type="button" className="public-filter driver-modal-filter" onClick={()=>{onFilter();onClose()}}>{filterActive?'전체 종목 다시 보기':'이 Driver와 연결된 종목만 보기'}</button>}
  <p className="fine">투자 권유가 아닌 관측 기록입니다.</p>
 </Modal.Body></>}</Modal.Dialog></Modal.Container></Modal.Backdrop></Modal>;
}
