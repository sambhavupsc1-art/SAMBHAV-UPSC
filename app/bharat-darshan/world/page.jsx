"use client";

import { useEffect, useMemo, useState } from "react";

/*
  SAMBHAV UPSC — WORLD MAP INTELLIGENCE
  Route: /world-map
  Independent from Bharat Darshan / India Mapping.
*/

const WORLD_GEOJSON_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

const CONTINENTS = ["All","Asia","Europe","Africa","North America","South America","Oceania","Antarctica"];

const COUNTRIES = [
  ["IN","India","Asia","New Delhi"],["CN","China","Asia","Beijing"],["PK","Pakistan","Asia","Islamabad"],
  ["AF","Afghanistan","Asia","Kabul"],["IR","Iran","Asia","Tehran"],["IQ","Iraq","Asia","Baghdad"],
  ["SA","Saudi Arabia","Asia","Riyadh"],["AE","United Arab Emirates","Asia","Abu Dhabi"],["OM","Oman","Asia","Muscat"],
  ["YE","Yemen","Asia","Sana'a"],["TR","Türkiye","Asia","Ankara"],["IL","Israel","Asia","Jerusalem"],
  ["KZ","Kazakhstan","Asia","Astana"],["UZ","Uzbekistan","Asia","Tashkent"],["TM","Turkmenistan","Asia","Ashgabat"],
  ["TJ","Tajikistan","Asia","Dushanbe"],["KG","Kyrgyzstan","Asia","Bishkek"],["MN","Mongolia","Asia","Ulaanbaatar"],
  ["JP","Japan","Asia","Tokyo"],["KR","South Korea","Asia","Seoul"],["VN","Vietnam","Asia","Hanoi"],
  ["TH","Thailand","Asia","Bangkok"],["MM","Myanmar","Asia","Naypyidaw"],["BD","Bangladesh","Asia","Dhaka"],
  ["NP","Nepal","Asia","Kathmandu"],["BT","Bhutan","Asia","Thimphu"],["LK","Sri Lanka","Asia","Sri Jayawardenepura Kotte"],
  ["ID","Indonesia","Asia","Jakarta"],["MY","Malaysia","Asia","Kuala Lumpur"],["SG","Singapore","Asia","Singapore"],
  ["PH","Philippines","Asia","Manila"],["AU","Australia","Oceania","Canberra"],["NZ","New Zealand","Oceania","Wellington"],
  ["RU","Russia","Europe","Moscow"],["GB","United Kingdom","Europe","London"],["FR","France","Europe","Paris"],
  ["DE","Germany","Europe","Berlin"],["IT","Italy","Europe","Rome"],["ES","Spain","Europe","Madrid"],
  ["UA","Ukraine","Europe","Kyiv"],["PL","Poland","Europe","Warsaw"],["GR","Greece","Europe","Athens"],
  ["NO","Norway","Europe","Oslo"],["SE","Sweden","Europe","Stockholm"],["FI","Finland","Europe","Helsinki"],
  ["IS","Iceland","Europe","Reykjavik"],["US","United States","North America","Washington, D.C."],
  ["CA","Canada","North America","Ottawa"],["MX","Mexico","North America","Mexico City"],["CU","Cuba","North America","Havana"],
  ["BR","Brazil","South America","Brasília"],["AR","Argentina","South America","Buenos Aires"],["CL","Chile","South America","Santiago"],
  ["PE","Peru","South America","Lima"],["CO","Colombia","South America","Bogotá"],["VE","Venezuela","South America","Caracas"],
  ["ZA","South Africa","Africa","Pretoria"],["EG","Egypt","Africa","Cairo"],["LY","Libya","Africa","Tripoli"],
  ["DZ","Algeria","Africa","Algiers"],["MA","Morocco","Africa","Rabat"],["SD","Sudan","Africa","Khartoum"],
  ["ET","Ethiopia","Africa","Addis Ababa"],["KE","Kenya","Africa","Nairobi"],["TZ","Tanzania","Africa","Dodoma"],
  ["NG","Nigeria","Africa","Abuja"],["GH","Ghana","Africa","Accra"],["CD","DR Congo","Africa","Kinshasa"]
];

const META = Object.fromEntries(COUNTRIES.map(([id,name,continent,capital]) => [id,{id,name,continent,capital}]));

const POINTS = {
  capitals: [
    ["New Delhi",77.21,28.61],["Beijing",116.40,39.90],["Islamabad",73.09,33.69],
    ["Tehran",51.39,35.69],["Riyadh",46.72,24.71],["Ankara",32.86,39.93],
    ["Astana",71.43,51.17],["Tashkent",69.24,41.31],["Tokyo",139.69,35.68],
    ["Seoul",126.98,37.57],["Bangkok",100.50,13.76],["Jakarta",106.85,-6.21],
    ["Canberra",149.13,-35.28],["Moscow",37.62,55.75],["London",-0.13,51.51],
    ["Paris",2.35,48.86],["Berlin",13.40,52.52],["Rome",12.50,41.90],
    ["Cairo",31.24,30.04],["Nairobi",36.82,-1.29],["Pretoria",28.19,-25.75],
    ["Washington DC",-77.04,38.91],["Ottawa",-75.70,45.42],["Mexico City",-99.13,19.43],
    ["Brasilia",-47.88,-15.79],["Buenos Aires",-58.38,-34.60],["Santiago",-70.67,-33.45],
    ["Lima",-77.04,-12.05]
  ],
  physical: [
    ["Himalayas",84,29.5,"Mountain range"],["Karakoram",77,35.5,"Mountain range"],
    ["Hindu Kush",70,36,"Mountain range"],["Tien Shan",80,42.5,"Mountain range"],
    ["Ural Mountains",59,60,"Mountain range"],["Alps",10.5,46.5,"Mountain range"],
    ["Atlas",3,32,"Mountain range"],["Andes",-70,-15,"Mountain range"],
    ["Rockies",-115,42,"Mountain range"],["Great Dividing Range",147,-30,"Mountain range"],
    ["Sahara",10,23,"Desert"],["Arabian Desert",45,25,"Desert"],["Gobi",105,43,"Desert"],
    ["Kalahari",22,-23,"Desert"],["Atacama",-69,-23,"Desert"],["Amazon Basin",-60,-5,"Basin"],
    ["Tibetan Plateau",88,32,"Plateau"]
  ],
  straits: [
    ["Strait of Hormuz",56.5,26.6,"Persian Gulf ↔ Gulf of Oman"],
    ["Strait of Malacca",100,3,"Andaman Sea ↔ South China Sea"],
    ["Bab-el-Mandeb",43.3,12.6,"Red Sea ↔ Gulf of Aden"],
    ["Gibraltar",-5.6,35.9,"Atlantic ↔ Mediterranean"],
    ["Bosporus",29.1,41.1,"Black Sea ↔ Sea of Marmara"],
    ["Dardanelles",26.3,40.2,"Aegean Sea ↔ Sea of Marmara"],
    ["Bering Strait",-169,65.8,"Arctic ↔ Pacific"],
    ["Dover Strait",1.3,51,"English Channel"],
    ["Taiwan Strait",119.5,24,"South China Sea"],
    ["Palk Strait",79.8,9.8,"Bay of Bengal"],
    ["Sunda Strait",105.8,-5.9,"Java Sea ↔ Indian Ocean"],
    ["Lombok Strait",116,-8.5,"Bali Sea ↔ Indian Ocean"]
  ],
  hotspots: [
    ["South China Sea",114,13,"Indo-Pacific / maritime geography"],
    ["West Asia",44,29,"Energy + geopolitics"],["Central Asia",68,43,"Landlocked states + connectivity"],
    ["Arctic",0,82,"Sea routes + resources"],["Horn of Africa",48,9,"Red Sea / Gulf of Aden"],
    ["Sahel",0,15,"Africa physical + geopolitical region"],["Indo-Pacific",120,5,"Maritime strategy"],
    ["Eastern Mediterranean",34,35,"Energy + strategic geography"]
  ],
  resources: [
    ["Persian Gulf",51,27,"Petroleum and natural gas"],["West Siberia",75,60,"Hydrocarbons"],
    ["North Sea",2,57,"Offshore hydrocarbons"],["Gulf of Mexico",-90,24,"Offshore hydrocarbons"],
    ["Great Plains",-100,40,"Agricultural belt"],["Pampas",-62,-35,"Agricultural belt"]
  ]
};

const QUIZ = [
  ["Which strait connects the Persian Gulf with the Gulf of Oman?",["Malacca","Hormuz","Gibraltar","Bering"],1,"Strait of Hormuz"],
  ["Bab-el-Mandeb connects the Red Sea with which body?",["Gulf of Aden","Persian Gulf","Black Sea","South China Sea"],0,"Gulf of Aden"],
  ["The Strait of Malacca lies between the Malay Peninsula and which island?",["Java","Borneo","Sumatra","Sri Lanka"],2,"Sumatra"],
  ["Which range is commonly used as part of the Europe–Asia boundary?",["Andes","Ural","Atlas","Rockies"],1,"Ural Mountains"],
  ["Which desert lies mainly in Mongolia and northern China?",["Sahara","Gobi","Kalahari","Atacama"],1,"Gobi"],
  ["Bosporus connects the Black Sea with which sea?",["Aegean","Red Sea","Sea of Marmara","Mediterranean"],2,"Sea of Marmara"],
  ["Which mountain system runs along western South America?",["Alps","Andes","Himalayas","Tien Shan"],1,"Andes"],
  ["Palk Strait separates India and which country?",["Indonesia","Sri Lanka","Myanmar","Thailand"],1,"Sri Lanka"]
];

const norm = x => String(x || "").trim().toLowerCase();

function project(lon,lat,w,h,p=15){
  return [p+((lon+180)/360)*(w-p*2),p+((90-lat)/180)*(h-p*2)];
}

function ringPath(r,w,h){
  return r.map(([lon,lat],i)=>{
    const [x,y]=project(lon,lat,w,h);
    return `${i?"L":"M"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ")+" Z";
}

function geometryPath(g,w,h){
  if(!g) return "";
  if(g.type==="Polygon") return g.coordinates.map(r=>ringPath(r,w,h)).join(" ");
  if(g.type==="MultiPolygon") return g.coordinates.flatMap(p=>p.map(r=>ringPath(r,w,h))).join(" ");
  return "";
}

function featureId(f){
  const p=f?.properties||{};
  const raw=p["ISO3166-1-Alpha-2"]||p.ISO_A2||p.ISO_A2_EH;
  if(raw && raw!=="-99") return String(raw).toUpperCase();
  const n=norm(p.ADMIN||p.NAME||p.name);
  return Object.values(META).find(x=>norm(x.name)===n)?.id||null;
}

export default function WorldMapPage(){
  const [geo,setGeo]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
  const [layer,setLayer]=useState("countries"),[continent,setContinent]=useState("All");
  const [query,setQuery]=useState(""),[selected,setSelected]=useState(null);
  const [mode,setMode]=useState("explore"),[theme,setTheme]=useState("dark");
  const [recall,setRecall]=useState(0),[revealed,setRevealed]=useState(false);
  const [quiz,setQuiz]=useState(0),[answer,setAnswer]=useState(null),[score,setScore]=useState(0);
  const [mastered,setMastered]=useState({});

  const W=1100,H=560;

  useEffect(()=>{
    try{
      const t=localStorage.getItem("sambhav-world-theme");
      const p=localStorage.getItem("sambhav-world-progress");
      if(t==="light"||t==="dark")setTheme(t);
      if(p)setMastered(JSON.parse(p));
    }catch{}
  },[]);

  useEffect(()=>{
    try{
      localStorage.setItem("sambhav-world-theme",theme);
      localStorage.setItem("sambhav-world-progress",JSON.stringify(mastered));
    }catch{}
  },[theme,mastered]);

  useEffect(()=>{
    let stop=false;
    fetch(WORLD_GEOJSON_URL,{cache:"force-cache"})
      .then(r=>{if(!r.ok)throw new Error(`World map request failed (${r.status})`);return r.json()})
      .then(j=>{if(!stop)setGeo(j)})
      .catch(e=>{if(!stop)setError(e.message||"World map could not be loaded.")})
      .finally(()=>{if(!stop)setLoading(false)});
    return()=>{stop=true};
  },[]);

  const features=useMemo(()=>Array.isArray(geo?.features)?geo.features.map(f=>({f,id:featureId(f)})).filter(x=>x.id):[],[geo]);

  const countries=useMemo(()=>{
    const q=norm(query);
    return Object.values(META).filter(c=>
      (continent==="All"||c.continent===continent)&&
      (!q||norm(c.name).includes(q)||norm(c.capital).includes(q)||norm(c.id).includes(q))
    );
  },[query,continent]);

  const selectedCountry=selected?META[selected]:null;
  const q=QUIZ[quiz];

  function mark(key){setMastered(p=>({...p,[key]:Date.now()}))}
  function chooseQuiz(i){if(answer!==null)return;setAnswer(i);if(i===q[2])setScore(s=>s+1)}

  const light=theme==="light";

  return <main className={light?"world light":"world"}>
    <style jsx global>{`
      :root{--bg:#07111f;--panel:#0d1a2b;--panel2:#12243a;--text:#edf5ff;--muted:#91a6bd;--border:rgba(255,255,255,.1);--accent:#65a8ff;--green:#70dfbd;--land:#1b3047;--active:#294c6e;--sel:#3d82c7;--water:#06101c}
      .world.light{--bg:#f4f7fb;--panel:#fff;--panel2:#eef4fa;--text:#10243a;--muted:#63758a;--border:rgba(15,35,58,.11);--land:#d7e3ee;--active:#b9d5ed;--sel:#6ba5d8;--water:#e8f0f8}
      *{box-sizing:border-box}.world{min-height:100vh;background:radial-gradient(circle at 10% 0%,rgba(67,139,226,.16),transparent 28%),var(--bg);color:var(--text);padding:22px;font-family:Inter,system-ui,sans-serif}.shell{max-width:1500px;margin:auto}
      .head{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:16px}.brand{display:flex;gap:12px;align-items:center}.logo{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#397cc9,#55cda9);font-weight:900;font-size:22px;color:white}.kicker{font-size:10px;letter-spacing:.16em;color:var(--green);font-weight:900}.title{font-size:28px;font-weight:900;letter-spacing:-.04em;margin:2px 0}.sub{font-size:12px;color:var(--muted)}.actions{display:flex;gap:7px;flex-wrap:wrap}
      button{font:inherit}.btn{border:1px solid var(--border);background:var(--panel);color:var(--text);border-radius:10px;padding:9px 12px;cursor:pointer;font-size:11px;font-weight:800}.btn.active{background:rgba(101,168,255,.14);border-color:rgba(101,168,255,.4);color:var(--accent)}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}.stat{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:11px}.stat b{font-size:18px;display:block}.stat span{font-size:9px;color:var(--muted)}
      .grid{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:14px}.card{background:var(--panel);border:1px solid var(--border);border-radius:17px;box-shadow:0 18px 55px rgba(0,0,0,.14);overflow:hidden}.top{padding:13px;border-bottom:1px solid var(--border);display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap}.tabs{display:flex;gap:6px;flex-wrap:wrap}.tab{border:1px solid var(--border);background:transparent;color:var(--muted);padding:8px 10px;border-radius:9px;font-size:10px;font-weight:900;cursor:pointer}.tab.active{color:var(--accent);border-color:rgba(101,168,255,.4);background:rgba(101,168,255,.12)}
      .map{padding:8px;background:var(--water);position:relative}.svg{width:100%;display:block}.side{padding:14px;display:flex;flex-direction:column;gap:11px}.input{width:100%;border:1px solid var(--border);background:var(--panel2);color:var(--text);border-radius:10px;padding:11px;outline:none}.chips{display:flex;gap:5px;flex-wrap:wrap}.chip{border:1px solid var(--border);background:transparent;color:var(--muted);border-radius:999px;padding:6px 8px;font-size:9px;font-weight:800;cursor:pointer}.chip.active{color:var(--text);background:rgba(101,168,255,.13);border-color:rgba(101,168,255,.4)}
      .label{font-size:10px;color:var(--muted);font-weight:900;text-transform:uppercase;letter-spacing:.1em}.list{max-height:350px;overflow:auto;display:flex;flex-direction:column;gap:5px}.item{padding:9px;border-radius:9px;background:var(--panel2);border:1px solid transparent;cursor:pointer}.item:hover{border-color:var(--border)}.name{font-size:11px;font-weight:900}.small{font-size:9px;color:var(--muted);margin-top:2px}.code{float:right;color:var(--accent);font-size:9px;font-weight:900}
      .bottom{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:14px}.box{padding:16px;min-height:180px}.box h3{font-size:14px;margin:0 0 7px}.box p{font-size:11px;line-height:1.6;color:var(--muted);margin:0}.recall{background:var(--panel2);border:1px solid var(--border);border-radius:12px;padding:14px}.recall-name{font-size:19px;font-weight:900;margin:5px 0}.options button{width:100%;text-align:left;margin-top:6px;padding:9px;border-radius:9px;border:1px solid var(--border);background:transparent;color:var(--text);cursor:pointer;font-size:10px}.correct{background:rgba(70,210,155,.13)!important;border-color:rgba(70,210,155,.55)!important}.wrong{background:rgba(255,100,110,.13)!important;border-color:rgba(255,100,110,.55)!important}.maplabel{fill:var(--text);font-size:8px;font-weight:800;paint-order:stroke;stroke:var(--water);stroke-width:3px}.point{fill:var(--accent);stroke:var(--bg);stroke-width:2;cursor:pointer}.note{font-size:9px;color:var(--muted);line-height:1.5}.error{text-align:center;padding:70px 20px;color:var(--muted)}
      @media(max-width:950px){.grid{grid-template-columns:1fr}.bottom{grid-template-columns:1fr}.head{align-items:flex-start}}@media(max-width:600px){.world{padding:10px}.title{font-size:22px}.stats{grid-template-columns:repeat(2,1fr)}.map{overflow:hidden}.map svg{min-width:650px}.map{overflow-x:auto}}
    `}</style>

    <div className="shell">
      <header className="head">
        <div className="brand"><div className="logo">◎</div><div><div className="kicker">SAMBHAV UPSC • GEOGRAPHY INTELLIGENCE</div><div className="title">WORLD MAP</div><div className="sub">Explore the world • Learn locations • Master UPSC mapping</div></div></div>
        <div className="actions">
          <button className={`btn ${mode==="explore"?"active":""}`} onClick={()=>setMode("explore")}>Explore</button>
          <button className={`btn ${mode==="recall"?"active":""}`} onClick={()=>setMode("recall")}>Active Recall</button>
          <button className={`btn ${mode==="quiz"?"active":""}`} onClick={()=>setMode("quiz")}>Map Quiz</button>
          <button className="btn" onClick={()=>setTheme(light?"dark":"light")}>{light?"Dark":"Light"}</button>
        </div>
      </header>

      <div className="stats">
        <div className="stat"><b>{Object.keys(META).length}+</b><span>Country intelligence</span></div>
        <div className="stat"><b>{POINTS.straits.length}</b><span>Strategic straits</span></div>
        <div className="stat"><b>{POINTS.physical.length}</b><span>Physical features</span></div>
        <div className="stat"><b>{Object.keys(mastered).length}</b><span>Items mastered</span></div>
      </div>

      <div className="grid">
        <section className="card">
          <div className="top">
            <div className="tabs">
              {["countries","capitals","physical","straits","hotspots","resources"].map(x=>
                <button key={x} className={`tab ${layer===x?"active":""}`} onClick={()=>setLayer(x)}>
                  {x==="countries"?"◎ Countries":x==="capitals"?"⌖ Capitals":x==="physical"?"△ Physical":x==="straits"?"⇆ Straits":x==="hotspots"?"✦ UPSC Hotspots":"◆ Resources"}
                </button>
              )}
            </div>
            <div className="kicker">{continent.toUpperCase()}</div>
          </div>

          <div className="map">
            {loading && <div className="error">Loading world country boundaries…</div>}
            {!loading && error && <div className="error"><b>World map unavailable</b><p>{error}</p></div>}
            {!loading && !error && <svg className="svg" viewBox={`0 0 ${W} ${H}`} aria-label="Interactive world map">
              <rect width={W} height={H} fill="var(--water)"/>
              {features.map(({f,id})=>{
                const c=META[id];
                const fill=selected===id?"var(--sel)":(continent!=="All"&&c?.continent===continent?"var(--active)":"var(--land)");
                return <path key={id+JSON.stringify(f.geometry).slice(0,20)} d={geometryPath(f.geometry,W,H)} fill={fill} stroke="rgba(255,255,255,.16)" strokeWidth=".55" onClick={()=>setSelected(id)} style={{cursor:"pointer"}}><title>{c?.name||id}</title></path>
              })}
              {layer!=="countries" && POINTS[layer]?.map((p,i)=>{
                const [x,y]=project(p[1],p[2],W,H);
                return <g key={p[0]+i} onClick={()=>setQuery(p[0])}><circle className="point" cx={x} cy={y} r="4"/><text className="maplabel" x={x+6} y={y-6}>{p[0]}</text><title>{p[0]} — {p[3]||""}</title></g>
              })}
            </svg>}
          </div>
        </section>

        <aside className="card side">
          {mode==="recall" ? <div>
            <div className="label">Active Recall</div>
            <div className="recall" style={{marginTop:8}}>
              <div className="kicker">{POINTS.straits[recall%POINTS.straits.length][3]}</div>
              <div className="recall-name">{POINTS.straits[recall%POINTS.straits.length][0]}</div>
              <div className="note">{revealed?"Locate and explain its adjoining seas/countries on the map.":"Think of the location before revealing."}</div>
              {revealed&&<div className="small" style={{marginTop:9}}>Coordinates are used only for the map position; the learning task is location recognition.</div>}
            </div>
            <div className="actions" style={{marginTop:9}}>
              <button className="btn" onClick={()=>setRevealed(v=>!v)}>{revealed?"Hide":"Reveal"}</button>
              <button className="btn active" onClick={()=>{mark("recall-"+POINTS.straits[recall%POINTS.straits.length][0]);setRevealed(false);setRecall(i=>i+1)}}>I KNEW IT</button>
            </div>
          </div> : mode==="quiz" ? <div>
            <div className="label">Prelims Map Quiz</div>
            <div className="recall" style={{marginTop:8}}>
              <div className="recall-name" style={{fontSize:14}}>{q[0]}</div>
              <div className="options">{q[1].map((o,i)=><button key={o} className={answer!==null&&i===q[2]?"correct":answer===i?"wrong":""} onClick={()=>chooseQuiz(i)}>{String.fromCharCode(65+i)}. {o}</button>)}</div>
              {answer!==null&&<div className="note" style={{marginTop:9}}>Correct location/concept: <b>{q[3]}</b></div>}
            </div>
            <div className="actions" style={{marginTop:9}}><button className="btn active" onClick={()=>{setAnswer(null);setQuiz(i=>(i+1)%QUIZ.length)}}>Next Question</button><span className="btn">Score: {score}</span></div>
          </div> : <>
            <input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search country, capital or map feature…"/>
            <div className="chips">{CONTINENTS.map(x=><button key={x} className={`chip ${continent===x?"active":""}`} onClick={()=>setContinent(x)}>{x}</button>)}</div>
            {selectedCountry&&<div className="recall">
              <div className="label">Selected country</div>
              <div className="recall-name">{selectedCountry.name}</div>
              <div className="note"><b>Capital:</b> {selectedCountry.capital}<br/><b>Continent:</b> {selectedCountry.continent}<br/><b>ISO:</b> {selectedCountry.id}</div>
              <button className="btn active" style={{marginTop:10,width:"100%"}} onClick={()=>mark("country-"+selectedCountry.id)}>Mark Mastered</button>
            </div>}
            <div className="label">Countries • {countries.length}</div>
            <div className="list">{countries.slice(0,100).map(c=><div className="item" key={c.id} onClick={()=>setSelected(c.id)}><span className="code">{c.id}</span><div className="name">{c.name}</div><div className="small">Capital: {c.capital} • {c.continent}</div></div>)}</div>
          </>}
        </aside>
      </div>

      <div className="bottom">
        <section className="card box"><h3>UPSC Mapping Workflow</h3><p>Locate → identify neighbours → identify adjoining sea/ocean → understand physical setting → connect strategic relevance → solve a map-based question.</p><button className="btn active" style={{marginTop:14}} onClick={()=>{setLayer("straits");setMode("explore")}}>Practice Strategic Straits</button></section>
        <section className="card box"><h3>Physical Geography</h3><p>Major mountain systems, deserts, plateaus and basins are available as location-first map objects. Use the Physical layer for rapid revision.</p><button className="btn active" style={{marginTop:14}} onClick={()=>{setLayer("physical");setMode("explore")}}>Open Physical Layer</button></section>
        <section className="card box"><h3>Active Recall + Quiz</h3><p>Use Active Recall for location memory and Map Quiz for UPSC-style practice. Mastered items are saved in browser storage.</p><button className="btn active" style={{marginTop:14}} onClick={()=>setMode("recall")}>Start Recall</button></section>
      </div>
    </div>
  </main>;
}
