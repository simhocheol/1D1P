import React from 'react';
import MarketPulse from './market-pulse.jsx';
import {useContextData,ContextCard,DirectionCard,GlobalCard} from './market-context.jsx';
// Home: two columns. Left = where the market stands (long-run) and what people do about it;
// right = what is moving now and where the economy is heading; the world map spans both columns.
export default function HomeDashboard(){
 const ctx=useContextData();
 return <div className="home-grid"><div className="home-col"><ContextCard {...ctx}/></div><div className="home-col"><MarketPulse/><DirectionCard {...ctx}/></div><div className="home-wide-row"><GlobalCard {...ctx}/></div></div>;
}
