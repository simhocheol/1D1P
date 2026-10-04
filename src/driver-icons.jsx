import React from 'react';
import {ShoppingCart,Receipt,Percent,Landmark,Droplets,ArrowLeftRight,Scale,Factory,Cpu,ChartColumnIncreasing,Wallet,Briefcase,CircleDot} from 'lucide-react';
const icons={demand:ShoppingCart,cost:Receipt,rates:Percent,credit:Landmark,liquidity:Droplets,fx:ArrowLeftRight,policy:Scale,supply:Factory,investment:Cpu,revenue:ChartColumnIncreasing,margin:Wallet,capital:Briefcase};
export function DriverIcon({id,size=16,className=''}){const Icon=icons[id]||CircleDot;return <span className={`driver-icon layer-icon-${id} ${className}`} aria-hidden="true"><Icon size={size}/></span>}
