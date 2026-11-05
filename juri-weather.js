/* Seasonal costumes and Seoul current weather. No location permission required. */
let juriWeather=null;
const juriSeason=m=>m>=3&&m<=5?'spring':m>=6&&m<=8?'summer':m>=9&&m<=11?'autumn':'winter';
function juriWeatherMode(w){const c=w.weather_code;if([71,73,75,77,85,86].includes(c))return 'snow';if(c>=51)return 'rain';if(w.temperature_2m<=5)return 'cold';if(w.temperature_2m>=28)return 'hot';if(w.wind_speed_10m>=25)return 'wind';return c>=2?'cloud':'sun';}
const juriProps={
spring:`<g class="flower"><path d="M730 710Q760 620 805 570" stroke="#498340" stroke-width="12" fill="none"/><path d="M757 653Q693 598 747 603" fill="#79ab56"/><g fill="#f59dbb" stroke="#c7618a" stroke-width="3"><ellipse cx="806" cy="540" rx="23" ry="35"/><ellipse cx="806" cy="600" rx="23" ry="35"/><ellipse cx="775" cy="570" rx="35" ry="23"/><ellipse cx="836" cy="570" rx="35" ry="23"/></g><circle cx="806" cy="570" r="19" fill="#ffd96b"/></g><g class="butterfly" fill="#debaff" stroke="#a376bd" stroke-width="3"><ellipse cx="210" cy="270" rx="26" ry="17" transform="rotate(30 210 270)"/><ellipse cx="250" cy="270" rx="26" ry="17" transform="rotate(-30 250 270)"/><path d="M230 260v40" stroke-width="7"/></g>`,
summer:`<g class="sunhat"><path d="M348 280Q370 130 553 165Q675 182 700 285Z" fill="#f5d78c" stroke="#bf974b" stroke-width="5"/><path d="M340 264Q520 321 720 272" stroke="#48aeb0" stroke-width="25" fill="none"/><ellipse cx="525" cy="289" rx="232" ry="33" fill="#f5d78c" stroke="#bf974b" stroke-width="5"/></g><g class="fan"><path d="M785 692L698 561Q780 493 866 559Z" fill="#8bd7df" stroke="#368a9b" stroke-width="6"/><path d="M785 692v55M785 692l-52-130M785 692V545M785 692l49-130" stroke="#98673e" stroke-width="7"/></g>`,
autumn:`<g class="leaf"><path d="M786 621l-54-53 33-3-9-46 40 25 22-53 15 55 43-18-16 44 31 9-72 43Z" fill="#e78b37" stroke="#a85c26" stroke-width="4"/><path d="M808 552l-8 122" stroke="#955728" stroke-width="7"/></g>`,
winter:`<g class="scarf"><path d="M377 589Q509 654 635 602L651 643Q501 696 367 629Z" fill="#d85d64" stroke="#a8424b" stroke-width="4"/><path d="M600 644l-20 128 65 8 8-141" fill="#d85d64" stroke="#a8424b" stroke-width="4"/><path d="M586 751l62 7" stroke="#f5e4cb" stroke-width="13"/></g>`};
const rainProp=`<g class="umbrella"><path d="M800 325v329q0 40-30 34" stroke="#765d40" stroke-width="11" fill="none"/><path d="M612 333Q640 136 801 134Q967 143 989 333Q937 302 893 333Q847 300 800 333Q752 300 707 333Q661 303 612 333Z" fill="#78bddd" stroke="#367d9e" stroke-width="5"/><path d="M800 136Q704 200 707 333M800 136Q897 205 893 333" fill="none" stroke="#b5dfef" stroke-width="5"/></g>`;
function refreshJuriWeather(){
 const nowParts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
 const month=Number(nowParts.month),year=Number(nowParts.year),schoolYear=year-(month<3?1:0);
 const current=ST.view!=='work'||(ST.m===month&&ST.yr===schoolYear);
 const season=juriSeason(current?month:ST.m);
 const live=current&&juriWeather&&Date.now()-juriWeather.fetched<3600000;
 const mode=live?juriWeatherMode(juriWeather):season;
 const costume=['cold','snow'].includes(mode)?'winter':mode==='hot'?'summer':season;
 companion.dataset.weather=mode;
 let layer=companion.querySelector('.weather-costume');if(!layer){layer=document.createElementNS('http://www.w3.org/2000/svg','svg');layer.setAttribute('viewBox','0 0 1040 920');layer.classList.add('weather-costume');layer.setAttribute('aria-hidden','true');companion.querySelector('.juri-figure').append(layer);}
 let props=juriProps[costume];if(mode==='rain')props=rainProp;
 if(mode==='snow'||mode==='winter')props+=Array.from({length:5},(_,i)=>`<text class="snow-speck" x="${220+i*140}" y="${170+i%2*90}" style="animation-delay:-${i*.8}s" fill="#d6f1ff" font-size="44">❄</text>`).join('');
 if(mode==='rain')props+=Array.from({length:5},(_,i)=>`<path class="rain-speck" d="M${230+i*145} 90l-10 35" style="animation-delay:-${i*.4}s" stroke="#69aaca" stroke-width="9" stroke-linecap="round"/>`).join('');
 layer.innerHTML=props;
 let label=companion.querySelector('.weather-label');if(!label){label=document.createElement('div');label.className='weather-label';companion.querySelector('.companion-inner').append(label);}
 const names={spring:'봄꽃',summer:'여름',autumn:'가을',winter:'겨울',snow:'눈',rain:'비',cold:'추위',hot:'더위',wind:'바람',cloud:'흐림',sun:'맑음'};
 label.innerHTML=live?`서울 · ${names[mode]} ${Math.round(juriWeather.temperature_2m)}° <a href="https://open-meteo.com/" target="_blank" rel="noopener" aria-label="날씨 제공 Open-Meteo">${juriWeather.time.slice(11,16)}</a>`:`${current?month:ST.m}월 · ${names[season]}`;
}
const weatherPreviousRefresh=refreshCompanion;
refreshCompanion=function(){weatherPreviousRefresh();if(companion.isConnected)refreshJuriWeather();};
async function fetchJuriWeather(){try{const response=await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.5&longitude=127.12&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia%2FSeoul',{signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('weather');const w=(await response.json()).current;if(!w||!Number.isFinite(w.temperature_2m)||!Number.isFinite(w.weather_code)||Math.abs(Date.now()-Date.parse(w.time+'+09:00'))>7200000)throw Error('stale weather');juriWeather={...w,fetched:Date.now()};if(companion.isConnected)refreshJuriWeather();}catch{juriWeather=null;if(companion.isConnected)refreshJuriWeather();}}
fetchJuriWeather();setInterval(fetchJuriWeather,1800000);
