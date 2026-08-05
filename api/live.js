async function getWeather(){
  const url='https://api.open-meteo.com/v1/forecast?latitude=39.2904&longitude=-76.6122&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=3';
  const r=await fetch(url,{headers:{'user-agent':'Holleman-Command-Center/10.0'}});if(!r.ok)throw new Error('Weather unavailable');const p=await r.json();
  return{location:'Baltimore, MD',updatedAt:new Date().toISOString(),current:{temperature:p.current?.temperature_2m,feelsLike:p.current?.apparent_temperature,wind:p.current?.wind_speed_10m,code:p.current?.weather_code},days:(p.daily?.time||[]).map((date,i)=>({date,high:p.daily.temperature_2m_max[i],low:p.daily.temperature_2m_min[i],rain:p.daily.precipitation_probability_max[i],sunrise:p.daily.sunrise[i],sunset:p.daily.sunset[i]}))};
}
async function quote(symbol){
  const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
  const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 Holleman-Command-Center/10.0'}});if(!r.ok)throw new Error('Market unavailable');const result=(await r.json()).chart?.result?.[0];const closes=(result?.indicators?.quote?.[0]?.close||[]).filter(Number.isFinite);const price=closes.at(-1),prior=closes.at(-2)||price;return{symbol,price,change:price-prior,changePct:prior?((price-prior)/prior)*100:0};
}
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const output={updatedAt:new Date().toISOString(),weather:null,markets:[],errors:[]};
  const [weather,markets]=await Promise.allSettled([getWeather(),Promise.all([quote('^GSPC'),quote('^DJI'),quote('^IXIC'),quote('TSLA')])]);
  if(weather.status==='fulfilled')output.weather=weather.value;else output.errors.push(weather.reason?.message||'Weather unavailable');
  if(markets.status==='fulfilled')output.markets=markets.value;else output.errors.push(markets.reason?.message||'Markets unavailable');
  res.setHeader('Cache-Control','s-maxage=600, stale-while-revalidate=1800');return res.status(200).json(output);
}
