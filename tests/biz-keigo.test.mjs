import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {SCENES,CATEGORIES} from '../biz-listen/data.mjs';
import {KEIGO_SCENES,KEIGO_CATEGORIES} from '../biz-listen/keigo.mjs';
import {KEIGO_AUDIO} from '../biz-listen/keigo-audio.mjs';
import {makeQuestions,fresh,normalize,eligible,grade,DAY} from '../biz-listen/core.mjs';
import {keigoRelations,keigoLanding} from '../biz-listen/keigo-ui.mjs';
const questions=makeQuestions(SCENES);

test('existing question identities survive and all new choices are distinct and explained',()=>{
  assert.equal(SCENES.length,104);
  assert.equal(CATEGORIES.length,23);
  assert.equal(new Set(questions.map(q=>q.id)).size,208);
  for(let n=1;n<=80;n++)for(const kind of ['meaning','reply'])assert.ok(questions.find(q=>q.id===`biz-${String(n).padStart(3,'0')}-${kind}`));
  for(const q of questions){
    assert.equal(q.choices.length,4,q.id);
    assert.equal(q.choices.filter(x=>x.correct).length,1,q.id);
    assert.equal(new Set(q.choices.map(x=>x.text)).size,4,q.id);
    for(const c of q.choices){assert.equal(typeof c.text,'string',q.id);assert.ok(c.why,q.id);}
  }
  for(const s of KEIGO_SCENES){
    assert.ok(s.meaningPrompt&&s.meaningExplanation&&s.pattern.includes('['),s.id);
    for(const kind of ['meaning','reply'])for(const field of ['actor','listener','target','form'])assert.ok(s.keigo[kind][field],`${s.id} ${kind} ${field}`);
  }
});

test('advanced drills are immediately available without changing saved level or erasing old records',()=>{
  const state=normalize({...fresh(),level:1,favorites:['biz-001'],records:{'biz-001-reply':{seen:2,correct:1,wrong:1,box:0,due:0,needsReview:true}}});
  const before=JSON.stringify(state);
  assert.equal(eligible(questions,state,'keigo').length,48);
  for(const [mode,kind] of [['keigo-meaning','meaning'],['keigo-reply','reply']]){
    const list=eligible(questions,state,mode);assert.equal(list.length,24);assert.ok(list.every(q=>q.kind===kind&&q.scene.keigo));
  }
  for(const category of KEIGO_CATEGORIES)assert.equal(eligible(questions,state,'category',category.id).length,16);
  assert.ok(eligible(questions,state).every(q=>!q.scene.keigo));
  assert.equal(JSON.stringify(state),before);
});

test('new mistakes and subtitle hints enter the shared spaced review queue',()=>{
  const state=fresh(),q=questions.find(q=>q.id==='biz-104-reply'),now=Date.now();
  grade(state,q,false,false,false,false,now);
  assert.ok(eligible(questions,state,'review').some(x=>x.id===q.id));
  grade(state,q,true,false,true,false,now);
  assert.ok(state.records[q.id].needsReview);
  grade(state,q,true,false,false,false,now);
  assert.equal(state.records[q.id].needsReview,false);
  assert.equal(state.records[q.id].due,now+DAY);
  assert.equal(state.categoryStats['keigo-benefit'].total,3);
});

test('all new listening prompts, models and distractors have valid prebuilt audio cues',()=>{
  const durations=new Map();
  for(const s of KEIGO_SCENES){
    const utterances=[...s.dialogue,...[s.reply,...s.wrongReplies.map(x=>x.text)].map(text=>({voice:'male',text}))];
    for(const t of utterances){
      const key=t.voice+':'+t.text,cue=KEIGO_AUDIO[key];assert.ok(cue,`${s.id}: ${key}`);
      const file=new URL(`../biz-listen/audio/bundle-${cue[0]}.mp3`,import.meta.url);
      assert.ok(existsSync(file)&&statSync(file).size>1000);
      if(!durations.has(cue[0]))durations.set(cue[0],Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file.pathname],{encoding:'utf8'}).trim()));
      assert.ok(cue[1]>=0&&cue[2]>.1&&cue[1]+cue[2]<=durations.get(cue[0])+.05,key);
    }
  }
});

test('relationship feedback distinguishes action, listener and honor target without exposing it before answering',()=>{
  const s=KEIGO_SCENES.find(s=>s.id==='biz-089');
  assert.match(keigoRelations(s,'meaning'),/말하는 사원인 나/);
  assert.match(keigoRelations(s,'reply'),/자료를 직접 가져가는 부장/);
  const landing=keigoLanding(SCENES,questions,{});
  assert.match(landing,/data-mode="keigo-reply"/);
  assert.match(landing,/data-mode="keigo-meaning"/);
  assert.doesNotMatch(landing,/undefined|\[object Object\]/);
});
