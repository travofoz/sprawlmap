export const PROVIDERS = {
  anthropic:{
    label:'Claude (Anthropic)',url:'https://api.anthropic.com/v1/messages',
    models:['claude-sonnet-4-20250514','claude-haiku-4-5-20251001'],
    default:'claude-sonnet-4-20250514',format:'anthropic',keyHint:'sk-ant-...',
  },
  openai:{
    label:'GPT-4o (OpenAI)',url:'https://api.openai.com/v1/chat/completions',
    models:['gpt-4o-mini','gpt-4o'],default:'gpt-4o-mini',format:'openai',keyHint:'sk-...',
  },
  xai:{
    label:'Grok (xAI)',url:'https://api.x.ai/v1/chat/completions',
    models:['grok-beta'],default:'grok-beta',format:'openai',keyHint:'xai-...',
  },
  openrouter:{
    label:'OpenRouter (multi-model)',url:'https://openrouter.ai/api/v1/chat/completions',
    models:['meta-llama/llama-3-8b-instruct:free','z-ai/glm-4-9b','anthropic/claude-haiku-4-5','openai/gpt-4o-mini','mistralai/mistral-7b-instruct:free'],
    default:'meta-llama/llama-3-8b-instruct:free',format:'openai',keyHint:'sk-or-... (blank = free tier)',
    extraHeaders:{'HTTP-Referer':'https://travofoz.github.io/sprawlmap','X-Title':'Sprawlmap'},
  },
  cloudflare:{
    label:'Cloudflare AI',url:'',
    models:['@cf/meta/llama-3-8b-instruct','@cf/mistral/mistral-7b-instruct-v0.1'],
    default:'@cf/meta/llama-3-8b-instruct',format:'cloudflare',keyHint:'CF API token',
  },
  proxy:{
    label:'Self-hosted proxy',url:'/api/chat',
    models:['default'],default:'default',format:'openai',keyHint:'optional',
  },
};

export class LLM {
  constructor({provider='openrouter',apiKey='',model,accountId,proxyUrl}={}){
    this.cfg=PROVIDERS[provider]||PROVIDERS.openrouter;
    this.provider=provider;
    this.apiKey=apiKey;
    this.model=model||this.cfg.default;
    if(proxyUrl)this.cfg={...this.cfg,url:proxyUrl};
    if(provider==='cloudflare'&&accountId)
      this.cfg={...this.cfg,url:`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${this.model}`};
  }
  async chat(messages,system='',maxTokens=1000){
    const{url,format}=this.cfg;
    if(!url)throw new Error(`No URL configured for provider: ${this.provider}`);
    let body,headers;
    if(format==='anthropic'){
      headers={'Content-Type':'application/json','x-api-key':this.apiKey,'anthropic-version':'2023-06-01'};
      body={model:this.model,max_tokens:maxTokens,system,messages};
    }else if(format==='cloudflare'){
      headers={'Content-Type':'application/json','Authorization':`Bearer ${this.apiKey}`};
      const msgs=system?[{role:'system',content:system},...messages]:messages;
      body={messages:msgs,max_tokens:maxTokens};
    }else{
      headers={'Content-Type':'application/json','Authorization':`Bearer ${this.apiKey}`,...(this.cfg.extraHeaders||{})};
      const msgs=system?[{role:'system',content:system},...messages]:messages;
      body={model:this.model,messages:msgs,max_tokens:maxTokens};
    }
    const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});
    if(!r.ok){const e=await r.text();throw new Error(`${this.provider} ${r.status}: ${e.slice(0,300)}`);}
    return this._extract(await r.json(),format);
  }
  _extract(d,fmt){
    if(fmt==='anthropic')return d.content?.find(b=>b.type==='text')?.text||'';
    if(fmt==='cloudflare')return d.result?.response||d.response||'';
    return d.choices?.[0]?.message?.content||'';
  }
}

const PFX='scout_llm_';
export const saveKey=(p,k)=>{try{localStorage.setItem(PFX+p,k)}catch{}};
export const loadKey=p=>{try{return localStorage.getItem(PFX+p)||''}catch{return''}};
export const clearKey=p=>{try{localStorage.removeItem(PFX+p)}catch{}};

export function bestAvailable(){
  for(const p of['anthropic','openai','xai','openrouter','cloudflare','proxy']){
    const k=loadKey(p);if(k)return new LLM({provider:p,apiKey:k});
  }
  // free fallback — OpenRouter Llama free tier, no key needed
  return new LLM({provider:'openrouter',apiKey:''});
}
