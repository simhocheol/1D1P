import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import openaiConnection from './api/openai-connection.js';
import alpacaConnection from './api/alpaca-connection.js';
import credentials from './api/credentials.js';
import marketData from './api/market-data.js';
const localApi={name:'local-api',configureServer(server){const handlers={'/api/market-data':marketData,'/api/openai-connection':openaiConnection,'/api/alpaca-connection':alpacaConnection,'/api/credentials':credentials};server.middlewares.use((req,res,next)=>{const handler=handlers[req.url?.split('?')[0]];if(handler){handler(req,res).catch(()=>{res.statusCode=500;res.end('{"message":"서버 요청 처리 실패"}')});return}next()})}};
export default defineConfig({plugins:[react(),tailwindcss(),localApi],build:{rollupOptions:{input:{report:'index.html',dashboard:'dashboard.html'}}}});
