import { LoginForm } from '@/components/auth/login-form'

export const metadata = { title: '登入 | ID3A 管理平台' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* 左側品牌面板 */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* 背景漸層 */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950" />

        {/* 動態裝飾 */}
        <div className="absolute inset-0">
          <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
          <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px] animate-pulse [animation-delay:4s]" />

          {/* 網格裝飾 */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* 內容 */}
        <div className="relative z-10 flex flex-col justify-between px-12 py-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold tracking-wide">ID3A</h2>
              <p className="text-indigo-300/80 text-sm tracking-widest">MANAGEMENT PLATFORM</p>
            </div>
          </div>

          {/* 主文案 */}
          <div className="max-w-lg">
            <p className="text-indigo-300/60 text-sm font-medium tracking-[0.3em] uppercase mb-4">
              人才發展 × 訓練品質 × 天賦評量
            </p>
            <h1 className="text-5xl font-bold text-white leading-[1.15] mb-8">
              打造企業<br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                人才競爭力
              </span>
            </h1>
            <p className="text-lg text-indigo-200/70 leading-relaxed mb-12">
              從天賦評量洞察潛能、TTQS 確保訓練品質、<br />
              到講師認證與績效追蹤 —— 一站式管理平台，<br />
              讓每一次訓練都產生可衡量的價值。
            </p>

            {/* 功能亮點 */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🧠', title: '天賦評量', desc: '10 大腦驅力分析，精準識別人才潛能' },
                { icon: '📋', title: 'TTQS 合規', desc: '22 項指標管理，四階文件完整建檔' },
                { icon: '🎓', title: '講師認證', desc: '四級晉升制度，培養專業教學團隊' },
                { icon: '📊', title: '數據驅動', desc: '滿意度追蹤、營收分析、一目了然' },
              ].map((item, i) => (
                <div key={i} className="group p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-white text-sm font-semibold mb-1">{item.title}</p>
                  <p className="text-indigo-300/50 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 底部 */}
          <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
              {['E', 'L', 'A', 'S'].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900">
                  {c}
                </div>
              ))}
            </div>
            <p className="text-indigo-300/40 text-xs">
              已有超過 50 家企業信賴使用
            </p>
          </div>
        </div>
      </div>

      {/* 右側登入表單 */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/25">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ID3A 管理平台</h1>
            <p className="text-gray-400 text-sm mt-1">人才發展 × 訓練品質 × 天賦評量</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-gray-900">歡迎回來</h2>
            <p className="text-gray-500 mt-1.5">登入 ID3A 管理平台</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">
            <LoginForm />
          </div>

          <div className="text-center mt-8">
            <p className="text-xs text-gray-400">
              社團法人國際評量應用發展協會
            </p>
            <p className="text-[10px] text-gray-300 mt-1">
              ID3A — International Development of 3 Assessments Association
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
