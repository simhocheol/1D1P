import React from 'react';
import MarketPulse from './market-pulse.jsx';
import {useContextData,ContextCard,ScenarioCard,DirectionCard,GlobalCard} from './market-context.jsx';
// Home: two columns. Left = where the market stands (long-run) and what people do about it;
// right = what is moving now, where the economy is heading, and the world around it.
export default function HomeDashboard(){
 const ctx=useContextData();
 return <div className="home-grid"><div className="home-col"><ContextCard {...ctx}/><ScenarioCard {...ctx}/></div><div className="home-col"><MarketPulse/><DirectionCard {...ctx}/><GlobalCard {...ctx}/></div></div>;
}
