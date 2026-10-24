import {KEIGO_CATEGORIES} from './keigo.mjs?v=keigo1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function keigoRelations(scene,kind){
  const r=scene.keigo[kind];
  return `<aside class="keigo-relations" aria-label="행동 주체와 높임 방향 해설"><h3>${kind==='meaning'?'방금 들은 말의 관계':'정답 응답의 관계'}</h3><dl>${[['실제 행동 주체',r.actor],['지금 듣는 사람',r.listener],['높임·정중함의 방향',r.target],['사용한 경어',r.form]].map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><p class="keigo-contrast"><strong>헷갈리기 쉬운 차이</strong> ${esc(scene.keigo.contrast)}</p></aside>`;
}

export function keigoLanding(scenes,questions,records){
  const list=scenes.filter(s=>s.keigo),qs=questions.filter(q=>q.scene.keigo);
  const learned=qs.filter(q=>records[q.id]?.seen>0).length;
  return `<div class="keigo-training"><div class="page-heading"><div><span class="eyebrow muted">ADVANCED · KEIGO LISTENING</span><h1>존경어·겸양어, 누구를 높이는 말일까?</h1><p>단어를 외우는 데서 한 단계 더. 행동 주체와 듣는 상대가 달라지는 상황을 들어요.</p></div></div>
  <section class="panel keigo-intro"><div class="keigo-intro-heading"><div><span class="question-tag">Lv.4–5 · 경어 집중</span><h2>같은 부장, 다른 말하는 상대.</h2><p>사내에서 상사를 높이는 말과, 거래처에 우리 상사를 설명하는 말을 구분해요. 비슷하게 들리는 네 가지 보기에서 주체와 높임 방향을 판단하세요.</p></div><div class="keigo-count"><strong>${qs.length}</strong><span>듣기 문항 · ${list.length}개 상황</span><small>${learned}개 문항 학습</small></div></div>
  <div class="keigo-start-actions"><button class="button primary" data-action="start" data-mode="keigo">경어 실전 섞어서 듣기</button><button class="button secondary" data-action="start" data-mode="keigo-meaning">주체·높임 대상 판단</button><button class="button secondary" data-action="start" data-mode="keigo-reply">일본어 응답 골라 듣기</button></div><p class="keigo-note">현재 학습 단계와 관계없이 바로 연습할 수 있어요. 대화와 일본어 응답은 음성으로 듣고, 답을 고르면 한국어 관계 해설을 확인해요.</p></section>
  <div class="keigo-checklist" aria-label="경어를 고르는 세 가지 기준"><div><span>01</span><strong>누가 행동하나요?</strong><p>말하기·방문·열람·전달을 하는 사람을 먼저 찾아요.</p></div><div><span>02</span><strong>지금 누구에게 말하나요?</strong><p>같은 상사라도 사내 동료와 거래처 앞에서는 표현이 달라져요.</p></div><div><span>03</span><strong>누구를 높이나요?</strong><p>행동하는 사람, 행동이 향하는 상대, 듣는 상대를 구분해요.</p></div></div>
  <div class="section-line"><h2>헷갈리는 부분부터 골라 듣기</h2><a href="#review" class="text-button">오답 노트 보기</a></div><div class="keigo-topic-grid">${KEIGO_CATEGORIES.map((c,i)=>{const count=qs.filter(q=>q.scene.category===c.id).length;return `<article class="panel keigo-topic"><span class="eyebrow muted">FOCUS ${String(i+1).padStart(2,'0')} · ${count}문항</span><h2>${esc(c.name.replace('경어 · ',''))}</h2><p>${esc(c.description)}</p><p class="keigo-topic-example" lang="ja">${['社内の部長 ／ お客様に話す弊社の部長','お持ちします ／ お持ちになります','ご説明いただく ／ ご説明くださる'][i]}</p><button class="button secondary" data-action="category" data-id="${c.id}">이 주제로 8문항 듣기</button></article>`;}).join('')}</div>
  <section class="panel keigo-rules"><h2>“겸양어 = 무조건 내가 하는 행동”만으로는 부족해요.</h2><p>고객에게 우리 부장의 행동을 말할 때도 겸양 표현을 쓸 수 있어요. 또 「ご説明いただく」는 실제 설명은 상대가 하고, 나는 그 설명을 받는 구조예요. 「参る・申す・おる」는 듣는 상대에게 내 쪽 일을 정중히 전해요.</p><p>각 문항은 제시된 회사·상대·목적을 기준으로 답이 하나가 되도록 구성했어요. 실제 대화의 말투는 관계와 관행에 따라 달라질 수 있어요.</p><div class="keigo-source-links"><a href="#guide" class="text-button">경어 기본 가이드</a><a href="https://www.bunka.go.jp/seisaku/kokugo_nihongo/kokugo_shisaku/keigo/index.html" target="_blank" rel="noopener noreferrer" class="text-button">개념 참고 · 일본 문화청</a></div></section></div>`;
}
