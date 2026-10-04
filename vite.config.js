import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import openaiConnection from './api/openai-connection.js';
const localApi={name:'local-api',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url?.split('?')[0]==='/api/openai-connection'){openaiConnection(req,res).catch(()=>{res.statusCode=500;res.end('{"message":"서버 요청 처리 실패"}')});return}next()})}};
export default defineConfig({plugins:[react(),tailwindcss(),localApi],build:{rollupOptions:{input:{report:'index.html',dashboard:'dashboard.html'}}}});
