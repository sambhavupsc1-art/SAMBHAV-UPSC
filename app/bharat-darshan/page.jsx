"use client";

import { useRouter } from "next/navigation";

export default function BharatDarshanHome() {
  const router = useRouter();

  return (
    <main className="bd-home">
      <style jsx global>{`
        *{box-sizing:border-box}

        .bd-home{
          min-height:100vh;
          padding:28px;
          background:
            radial-gradient(circle at 10% 0%,rgba(54,125,214,.18),transparent 30%),
            radial-gradient(circle at 90% 10%,rgba(56,196,151,.12),transparent 28%),
            #07111f;
          color:#edf5ff;
          font-family:Inter,system-ui,sans-serif
        }

        .bd-shell{
          max-width:1180px;
          margin:auto
        }

        .bd-head{
          text-align:center;
          padding:32px 0 26px
        }

        .bd-kicker{
          font-size:11px;
          letter-spacing:.18em;
          color:#70dfbd;
          font-weight:900;
          text-transform:uppercase
        }

        .bd-title{
          font-size:42px;
          line-height:1.05;
          margin:9px 0 8px;
          font-weight:950;
          letter-spacing:-.05em
        }

        .bd-sub{
          font-size:14px;
          color:#92a8c0
        }

        .bd-grid{
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:18px;
          margin-top:20px
        }

        .bd-card{
          position:relative;
          overflow:hidden;
          min-height:430px;
          border:1px solid rgba(255,255,255,.1);
          border-radius:24px;
          background:
            linear-gradient(145deg,rgba(255,255,255,.05),rgba(255,255,255,.015)),
            #0d1a2b;
          box-shadow:0 24px 70px rgba(0,0,0,.24);
          padding:25px;
          cursor:pointer;
          text-align:left;
          color:inherit;
          transition:.2s transform,.2s border-color,.2s box-shadow;
          width:100%
        }

        .bd-card:hover{
          transform:translateY(-4px);
          border-color:rgba(101,168,255,.45);
          box-shadow:0 30px 80px rgba(0,0,0,.32)
        }

        .bd-card.world:hover{
          border-color:rgba(112,223,189,.45)
        }

        .bd-card.test:hover{
          border-color:rgba(177,132,255,.5)
        }

        .bd-glow{
          position:absolute;
          width:260px;
          height:260px;
          border-radius:50%;
          filter:blur(60px);
          opacity:.16;
          right:-80px;
          top:-80px;
          background:#3d82c7
        }

        .world .bd-glow{
          background:#55cda9
        }

        .test .bd-glow{
          background:#9b6cff
        }

        .bd-icon{
          width:58px;
          height:58px;
          border-radius:17px;
          display:grid;
          place-items:center;
          font-size:27px;
          font-weight:900;
          background:rgba(101,168,255,.14);
          border:1px solid rgba(101,168,255,.25);
          position:relative
        }

        .world .bd-icon{
          background:rgba(112,223,189,.13);
          border-color:rgba(112,223,189,.25)
        }

        .test .bd-icon{
          background:rgba(155,108,255,.13);
          border-color:rgba(155,108,255,.28)
        }

        .bd-card h2{
          font-size:27px;
          margin:25px 0 7px;
          letter-spacing:-.03em;
          position:relative
        }

        .bd-card p{
          color:#93a7bd;
          font-size:13px;
          line-height:1.65;
          max-width:480px;
          position:relative
        }

        .bd-tags{
          display:flex;
          gap:7px;
          flex-wrap:wrap;
          margin-top:20px;
          position:relative
        }

        .bd-tag{
          border:1px solid rgba(255,255,255,.1);
          background:rgba(255,255,255,.035);
          padding:7px 9px;
          border-radius:999px;
          font-size:10px;
          color:#b7c7d9;
          font-weight:800
        }

        .bd-open{
          position:absolute;
          left:25px;
          right:25px;
          bottom:25px;
          padding:12px 14px;
          border-radius:12px;
          border:1px solid rgba(101,168,255,.32);
          background:rgba(101,168,255,.12);
          color:#8ec2ff;
          font-weight:900;
          font-size:12px;
          text-align:center
        }

        .world .bd-open{
          border-color:rgba(112,223,189,.3);
          background:rgba(112,223,189,.1);
          color:#82e5c4
        }

        .test .bd-open{
          border-color:rgba(155,108,255,.35);
          background:rgba(155,108,255,.11);
          color:#c2a7ff
        }

        .bd-footer{
          text-align:center;
          color:#687e96;
          font-size:11px;
          margin-top:24px
        }

        @media(max-width:900px){
          .bd-grid{
            grid-template-columns:1fr
          }
        }

        @media(max-width:760px){
          .bd-home{
            padding:14px
          }

          .bd-title{
            font-size:32px
          }

          .bd-card{
            min-height:390px
          }
        }
      `}</style>

      <div className="bd-shell">
        <header className="bd-head">
          <div className="bd-kicker">
            SAMBHAV UPSC • MAP INTELLIGENCE
          </div>

          <h1 className="bd-title">
            BHARAT DARSHAN
          </h1>

          <div className="bd-sub">
            Explore India • Explore the World • Master Mapping
          </div>
        </header>

        <section className="bd-grid">

          {/* INDIA MAP */}
          <button
            className="bd-card"
            onClick={() => router.push("/bharat-darshan/india")}
          >
            <div className="bd-glow" />

            <div className="bd-icon">
              🇮🇳
            </div>

            <h2>
              India Map
            </h2>

            <p>
              India-focused UPSC mapping with states, rivers, mountains,
              passes, ecology, minerals, agriculture, climate and
              Mapping Class 2026 content.
            </p>

            <div className="bd-tags">
              <span className="bd-tag">States & UTs</span>
              <span className="bd-tag">Rivers</span>
              <span className="bd-tag">Mountains & Passes</span>
              <span className="bd-tag">Ecology</span>
              <span className="bd-tag">Mapping Class 2026</span>
            </div>

            <div className="bd-open">
              OPEN INDIA MAP →
            </div>
          </button>


          {/* WORLD MAP */}
          <button
            className="bd-card world"
            onClick={() => router.push("/bharat-darshan/world")}
          >
            <div className="bd-glow" />

            <div className="bd-icon">
              ◎
            </div>

            <h2>
              World Map
            </h2>

            <p>
              World Geography Intelligence for country locations,
              capitals, physical features, strategic straits,
              UPSC hotspots, resources, recall and map quizzes.
            </p>

            <div className="bd-tags">
              <span className="bd-tag">Countries</span>
              <span className="bd-tag">Capitals</span>
              <span className="bd-tag">Straits</span>
              <span className="bd-tag">Physical Geography</span>
              <span className="bd-tag">UPSC Hotspots</span>
            </div>

            <div className="bd-open">
              OPEN WORLD MAP →
            </div>
          </button>


          {/* MAP PRELIMS TEST */}
          <button
            className="bd-card test"
            onClick={() => router.push("/bharat-darshan/map-test")}
          >
            <div className="bd-glow" />

            <div className="bd-icon">
              🎯
            </div>

            <h2>
              Map Prelims Test
            </h2>

            <p>
              UPSC-style map practice with India and World mapping
              questions, timer, negative marking, question palette,
              score analysis and revision.
            </p>

            <div className="bd-tags">
              <span className="bd-tag">India Practice</span>
              <span className="bd-tag">World Practice</span>
              <span className="bd-tag">Mixed Test</span>
              <span className="bd-tag">Timer</span>
              <span className="bd-tag">Negative Marking</span>
            </div>

            <div className="bd-open">
              START MAP TEST →
            </div>
          </button>

        </section>

        <div className="bd-footer">
          India Map • World Map • Map Prelims Test — all inside Bharat Darshan.
        </div>
      </div>
    </main>
  );
}
