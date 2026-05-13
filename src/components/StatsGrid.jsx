const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-[#0a0f1d] border border-white/5 p-6 rounded-3xl space-y-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}</p>
      <h3 className="text-2xl font-black text-white mt-1">{value}</h3>
    </div>
  </div>
);

// Dashboard içinde kullanımı:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
  <StatCard label="Aktif Sinyaller" value="42" icon={Radio} color="bg-red-500/10 text-red-500" />
  <StatCard label="Onaylı Akıncılar" value="128" icon={Shield} color="bg-blue-500/10 text-blue-500" />
  <StatCard label="Bekleyen Onaylar" value="12" icon={Users} color="bg-yellow-500/10 text-yellow-500" />
  <StatCard label="Güven Skoru Ort." value="%94" icon={BarChart3} color="bg-green-500/10 text-green-500" />
</div>