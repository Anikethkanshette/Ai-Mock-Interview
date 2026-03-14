const fs = require('fs'); 
const file = 'c:\\Users\\chava\\OneDrive\\Desktop\\MOCK INTE PROJRCT\\apps\\web\\src\\styles.css'; 
const css = `
/* VERCEL ENTERPRISE SAAS DASHBOARD v2 */
.mi-dashboard-root { display: flex; height: 100vh; width: 100vw; background-color: #000; color: #ededed; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; overflow: hidden; }
.mi-sidebar { width: 260px; background-color: #0a0a0a; border-right: 1px solid rgba(255, 255, 255, 0.1); display: flex; flex-direction: column; padding: 24px 16px; z-index: 50; }
.mi-sidebar-brand { display: flex; align-items: center; gap: 12px; padding: 0 8px 32px 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 24px; }
.mi-brand-icon { background: linear-gradient(135deg, #fff, #888); border-radius: 6px; padding: 6px; color: #000; justify-content: center; display: flex;}
.mi-brand-text { font-weight: 600; font-size: 16px; letter-spacing: -0.02em; color: #fff; }
.mi-sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.mi-nav-group-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin: 0 8px 8px 8px; font-weight: 500; }
.mi-nav-btn { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; background: transparent; border: none; color: #a1a1aa; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; position: relative; text-align: left; }
.mi-nav-btn:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }
.mi-nav-btn.active { color: #fff; }
.mi-nav-active-pill { position: absolute; left: 0; top: 0; bottom: 0; right: 0; background: rgba(255, 255, 255, 0.1); border-radius: 8px; z-index: -1; border: 1px solid rgba(255, 255, 255, 0.1); }
.mi-sidebar-user { display: flex; align-items: center; gap: 12px; padding: 16px 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; margin-top: auto; }
.mi-user-details { display: flex; flex-direction: column; flex: 1; overflow:hidden;}
.mi-user-name { font-size: 14px; font-weight: 500; color: #fff; white-space:nowrap; text-overflow:ellipsis;}
.mi-user-plan { font-size: 12px; color: #666; }
.mi-logout-btn { background: transparent; border: none; color: #666; cursor: pointer; }
.mi-logout-btn:hover { color: #ef4444; }
.mi-main-canvas { flex: 1; display: flex; flex-direction: column; background-color: #000; position: relative; }
.mi-top-header { height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: #0a0a0a; }
.mi-header-breadcrumbs { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.mi-crumb { color: #666; }
.mi-crumb.active { color: #fff; font-weight: 500; }
.mi-status-badge { display: flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 99px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); font-size: 12px; color: #a1a1aa; }
.pulse-dot { width: 8px; height: 8px; border-radius: 50%; background-color: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.5); animation: pulse 2s infinite; }
@keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
.mi-content-area { flex: 1; padding: 32px; overflow-y: auto; }
.mi-bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }
.col-span-1 { grid-column: span 1; }
.mi-bento-card { background: #0a0a0a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
.mi-card-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
.mi-card-title-group h3 { margin: 0 0 4px 0; font-size: 18px; font-weight: 500; color: #fff; }
.mi-card-title-group p { margin: 0; font-size: 14px; color: #888; }
.mi-form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.mi-input-wrap { display: flex; flex-direction: column; gap: 8px; }
.mi-input-wrap label { font-size: 13px; color: #888; font-weight: 500; text-align: left; }
.mi-input, .mi-select, .mi-textarea { background: #000; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 10px 12px; color: #fff; font-size: 14px; outline: none; transition: all 0.2s ease; width: 100%; box-sizing:border-box;}
.mi-input:focus, .mi-select:focus, .mi-textarea:focus { border-color: #fff; box-shadow: 0 0 0 2px rgba(255,255,255,0.1); }
.mi-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent; width: 100%;}
.mi-btn.primary { background: #fff; color: #000; }
.mi-btn.primary:hover { background: #e5e5e5; transform: translateY(-1px); }
.mi-stat-block { margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;}
.mi-stat-value { font-size: 32px; font-weight: 600; line-height: 1; margin-bottom: 4px; }
.mi-stat-label { font-size: 13px; color: #666; }
.mi-pills-list { display: flex; flex-direction: column; gap: 8px; }
.mi-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; padding: 4px 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #a1a1aa; width: fit-content; text-transform:uppercase;}
.stat-card { display: flex; flex-direction: column; gap: 12px; }
.stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.stat-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.stat-icon.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.stat-icon.purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
.stat-val { font-size: 36px; font-weight: 600; color: #fff; margin:-4px 0; }
.stat-lbl { font-size: 13px; color: #888; text-transform:uppercase; letter-spacing:0.05em;}
.mi-table { width: 100%; border-collapse: collapse; text-align: left; }
.mi-table th { padding: 12px 16px; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 1px solid rgba(255,255,255,0.1); }
.mi-table td { padding: 16px; font-size: 14px; color: #ccc; border-bottom: 1px solid rgba(255,255,255,0.05); }
.mi-table tr:last-child td { border-bottom: none; }
`;
fs.appendFileSync(file, css);
console.log("Written CSS perfectly.");
