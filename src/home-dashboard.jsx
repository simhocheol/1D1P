import React from 'react';
import MarketPulse from './market-pulse.jsx';
import Funnel from './funnel.jsx';
import {useContextData,ContextCard,DirectionCard,GlobalCard} from './market-context.jsx';
// Home: the market pulse leads at full width; then where the market stands (left) and where the economy
// is heading (right); the world map closes at full width.
export default function HomeDashboard(){
 const ctx=useContextData();
 return <div className="home-grid"><div className="home-wide-row"><MarketPulse/></div><div className="home-wide-row"><Funnel/></div><div className="home-col"><ContextCard {...ctx}/></div><div className="home-col"><DirectionCard {...ctx}/></div><div className="home-wide-row"><GlobalCard {...ctx}/></div></div>;
}
