export const cutscenes = [
 {id:'c1',title:'비 오는 밤의 편지',chapter:'프롤로그',scene:'archive',shots:[
  {duration:6,caption:'빗소리만 남은 철도박물관. 오래된 편지 한 통이 도착했다.',speaker:'한겨울'},
  {duration:6,caption:'“돌아오지 못한 열차를 찾고 있어요. 운무역으로 와 주세요.”',speaker:'편지'},
  {duration:7,caption:'봉투 속에는, 1974년 날짜가 찍힌 은하 7호의 승차권이 들어 있었다.',speaker:'한겨울'}]},
 {id:'c2',title:'운무선 여행',chapter:'프롤로그',scene:'journey',shots:[
  {duration:8,caption:'지도 끝의 산골 마을. 끊긴 철길을 따라 오래된 이름을 찾아간다.',speaker:'한겨울'},
  {duration:5,caption:'운무역. 반세기 동안 한 대의 열차를 기다려 온 곳.',speaker:'한겨울'},
  {duration:5,caption:'어떤 이야기는, 도착하기 전까지 끝나지 않는다.',speaker:''}]},
 {id:'c3',title:'운무역 도착',chapter:'제1장',scene:'platform',shots:[
  {duration:7,caption:'안개 너머로 작은 목조 역이 모습을 드러냈다.',speaker:'한겨울'},
  {duration:6,caption:'이상하네. 폐역이라기엔 누군가 매일 쓸고 닦은 것 같아.',speaker:'한겨울'},
  {duration:5,caption:'시계는 11시 47분에 멈춰 있었다.',speaker:''},
  {duration:5,caption:'박물관에서 왔죠? 저 오복이에요! 같이 찾아볼래요?',speaker:'오복'}]},
 {id:'c4',title:'1974년, 그날 밤',chapter:'역장의 회상',scene:'flashback',shots:[
  {duration:7,caption:'1974년 10월 27일. 비가 그치지 않던 밤이었소.',speaker:'오만식'},
  {duration:6,caption:'윤서는 늘 그랬듯 웃었지. “다녀올게요. 도착하면 기적을 울릴게요.”',speaker:'오만식'},
  {duration:7,caption:'은하가 떠나고 산사태가 났소. 사람들은 무사히 돌아왔지만…',speaker:'오만식'},
  {duration:5,caption:'그날 이후 은하 7호는 운무역에 도착하지 못했소.',speaker:'오만식'}]},
 {id:'c5',title:'11시 47분의 기적',chapter:'제4장',scene:'night',shots:[
  {duration:7,caption:'온 마을이 잠든 시각. 산은 숨을 죽이고 있었다.',speaker:''},
  {duration:5,caption:'먼 터널 안에서 등불 하나가 깜박였다. 그리고 기적 소리.',speaker:'',whistle:true},
  {duration:6,caption:'들었죠? 바람 소리가 아니잖아요. 할아버지는 저 안에 있어요.',speaker:'오복'}]},
 {id:'c6',title:'비밀 차고의 진실',chapter:'최종장',scene:'cavern',shots:[
  {duration:7,caption:'불빛이 이어지자, 바위산 속에 숨겨진 정비 차고가 드러났다.',speaker:'한겨울'},
  {duration:8,caption:'은하 7호. 먼지 한 톨 없이 닦인 차체에 작은 별이 빛났다.',speaker:''},
  {duration:6,caption:'윤서는 정비선으로 열차를 피했소. 모두를 살렸지. 난… 이 열차 곁을 떠날 수 없었소.',speaker:'오만식'},
  {duration:7,caption:'이제 알겠어요. 잘못된 출발이 아니었어요. 아직 도착을 기다리는 거예요.',speaker:'한겨울',whistle:true}]},
 {id:'c7',title:'50년 만의 도착',chapter:'에필로그',scene:'spring',shots:[
  {duration:8,caption:'복원 작업을 마친 봄. 은하 7호가 오십 년 만에 운무역 2번 승강장에 섰다.',speaker:''},
  {duration:6,caption:'할아버지! 이번엔 제가 도착했다고 알려줄게요!',speaker:'오복',whistle:true},
  {duration:8,caption:'1974년 10월 27일, 11시 47분. 은하 7호 — 오늘, 마침내 도착.',speaker:'한겨울'}]}
];
export const clipDuration=clip=>clip.shots.reduce((sum,shot)=>sum+shot.duration,0);
export function shotAt(clip,seconds){let total=0;for(let i=0;i<clip.shots.length;i++){total+=clip.shots[i].duration;if(seconds<total)return i;}return clip.shots.length-1;}
export function parseMediaName(name){const m=/^(c[1-7])(?:_shot([1-4]))?\.(mp4|webm)$/i.exec(name);if(!m)return null;const clip=cutscenes.find(c=>c.id===m[1].toLowerCase());if(m[2]&&+m[2]>clip.shots.length)return null;return m[1].toLowerCase()+(m[2]?'_shot'+m[2]:'');}
