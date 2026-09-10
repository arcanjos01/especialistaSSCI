import csv,json,re,hashlib,subprocess
from pathlib import Path
R=Path('/home/cbmsc/especialistaSSCI'); O=Path('/tmp')
def blocks(path,kind):
 t=(R/path).read_text(); ms=list(re.finditer(r'^'+kind+r' (\S+)\s*$',t,re.M));return [{'id':m[1],'text':t[m.start():ms[i+1].start() if i+1<len(ms) else len(t)],'file':str(path),'line':t[:m.start()].count('\n')+1} for i,m in enumerate(ms)]
def vals(b,key):return re.findall(r'^'+key+r' (.+)$',b['text'],re.M)
def out(n,rows):
 p=O/('astra-coverage-'+n+'.csv')
 if rows:
  with p.open('w') as f:
   w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
reqs=blocks('knowledge-base/02_requirements.txt','REQUIREMENT');crit=blocks('knowledge-base/03_table1.txt','CRITERION')+blocks('knowledge-base/04_table4.txt','CRITERION');ncs=blocks('knowledge-base/05_nonconformities.txt','NONCONFORMITY');ents=blocks('knowledge-base/01_entities.txt','ENTITY')
for c in crit:c['req']=vals(c,'USES|REQUIREMENT') if False else re.findall(r'^(?:USES|REQUIREMENT) (\S+)$',c['text'],re.M)
reqby={b['id']:b for b in reqs};ncby={b['id']:b for b in ncs};cby={b['id']:b for b in crit};eby={b['id']:b for b in ents}
rows=[]
for r in reqs:
 for c in [c for c in crit if r['id'] in c['req']]:
  rows.append(dict(requirement=r['id'],criterion=c['id'],req_location=f"{r['file']}:{r['line']}",criterion_location=f"{c['file']}:{c['line']}",table='|'.join(vals(c,'TABLE')),source='|'.join(vals(r,'SOURCE')),article='|'.join(vals(r,'ARTICLE')),smsci='|'.join(vals(r,'SMSCI')),regime='|'.join(vals(r,'IN19_DOCUMENTATION_REGIME')),rt='|'.join(vals(r,'REQUIRED_TECHNICAL_RESPONSIBILITY')),catalog_id='|'.join(vals(r,'CATALOG_IDENTIFIER')),req_nc='|'.join(vals(r,'NONCONFORMITY')),criterion_fail_nc='|'.join(vals(c,'FAIL')),manual_review=bool(re.search(r'^MANUAL_REVIEW',c['text'],re.M)),assert_functions='|'.join(sorted(set(re.findall(r'\b([A-Z][A-Z_]+)\(',c['text'])))),primary_source_versioned='yes' if vals(r,'SOURCE')[0] in ('IN01','IN19') else 'no'))
out('req-criterion-nc-rt',rows)
ncrows=[]
for n in ncs:
 refs=vals(n,'REF_CRITERION');fires=[c['id'] for c in crit if n['id'] in vals(c,'FAIL')]
 ncrows.append(dict(nc=n['id'],location=f"{n['file']}:{n['line']}",ref_criterion='|'.join(refs),ref_requirement='|'.join(vals(n,'REF_REQUIREMENT')),fail_links='|'.join(fires),ref_exists=all(c in cby for c in refs),status='reachable_from_declared_FAIL' if fires else 'no_declared_FAIL'))
out('criterion-nc',ncrows)
rts=sorted(set(x for r in reqs for x in vals(r,'CATALOG_IDENTIFIER')))
out('rt-catalog',[dict(catalog_id=x,requirements='|'.join(r['id'] for r in reqs if x in vals(r,'CATALOG_IDENTIFIER')),aliases='|'.join(sorted(set(y for r in reqs if x in vals(r,'CATALOG_IDENTIFIER') for y in vals(r,'REQUIRED_TECHNICAL_RESPONSIBILITY')))),official_entry_present=False) for x in rts])
missing_docs=[]
for c in crit:
 for name in vals(c,'REQUIRE DOCUMENT'):
  if name not in eby:missing_docs.append(dict(document_symbol=name,criterion=c['id'],location=f"{c['file']}:{c['line']}",occurrences_in_entities=0))
out('undeclared-document-symbols',missing_docs)
files=subprocess.check_output(['git','ls-files','-z'],cwd=R).decode().split('\0'); inv=[]
for f in filter(None,files):
 p=R/f;inv.append(dict(path=f,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),scope=f.split('/')[0] if '/' in f else 'root'))
out('tracked-inventory',inv)
aux=[]
for p in sorted((R/'audit-cases').rglob('*')):
 if p.is_file():aux.append(dict(path=str(p.relative_to(R)),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),baseline=False))
out('local-case-inventory',aux)
rels=[]
for d in sorted(Path('/home/cbmsc/especialistaSSCI-releases').iterdir()):
 if d.is_dir():
  t=(d/'08_execution_pipeline.txt').read_text(); src=re.search(r'^SOURCE_COMMIT: (.+)$',t,re.M)[1]
  for p in sorted(d.glob('*.txt')):
   canonical=O/'astra-coverage-release-5.4.0'/p.name
   rels.append(dict(release=d.name,file=p.name,source_commit=src,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),identical_to_baseline_build=p.read_bytes()==canonical.read_bytes()))
out('local-release-comparison',rels)
sumry=dict(counts=dict(requirements=len(reqs),criteria=len(crit),nonconformities=len(ncs),entities=len(ents),rt_referenced=len(rts),rt_official_entries=0,tracked_files=len(inv),local_case_files=len(aux)),requirements_without_criterion=[r['id'] for r in reqs if not any(r['id'] in c['req'] for c in crit)],criteria_orphan=[c['id'] for c in crit if not all(r in reqby for r in c['req'])],nc_without_fail=[n['nc'] for n in ncrows if not n['fail_links']],criterion_fail_to_missing_nc=[(c['id'],n) for c in crit for n in vals(c,'FAIL') if n not in ncby],nc_orphan_refs=[n for n in ncrows if not n['ref_exists']],missing_document_definitions=missing_docs,duplicates={k:[i for i in set(b['id'] for b in bs) if sum(b['id']==i for b in bs)>1] for k,bs in [('requirements',reqs),('criteria',crit),('ncs',ncs),('entities',ents)]})
(O/'astra-coverage-summary.json').write_text(json.dumps(sumry,ensure_ascii=False,indent=2));print(json.dumps(sumry,ensure_ascii=False,indent=2))
engine=(R/'knowledge-base/00_engine.txt').read_text()
frows=[]
for c in crit:
 for fn in sorted(set(re.findall(r'\b([A-Z][A-Z_]+)\(',c['text']))):
  frows.append(dict(criterion=c['id'],function=fn,location=f"{c['file']}:{c['line']}",mentioned_in_formal_engine=fn in engine))
out('criterion-functions',frows)
products=[]
for r in reqs:
 for name in vals(r,'TECHNICAL_PRODUCT'):
  products.append(dict(requirement=r['id'],product=name,entity_declared=name in eby,location=f"{r['file']}:{r['line']}"))
out('technical-products',products)
print('Missing function contracts:',sorted(set(r['function'] for r in frows if not r['mentioned_in_formal_engine'])))
print('Missing product entities:',sorted(set(r['product'] for r in products if not r['entity_declared'])))
sumry['requirement_nc_to_missing_definition']=sorted(set(n for r in reqs for n in vals(r,'NONCONFORMITY') if n not in ncby))
sumry['missing_function_contracts']=sorted(set(r['function'] for r in frows if not r['mentioned_in_formal_engine']))
sumry['additional_undeclared_technical_product']='CONFORMITY_REPORT'
sumry['release_5_4_0_files_identical_to_baseline_build']=sum(r['identical_to_baseline_build'] for r in rels if r['release']=='SSCI-HABITESE-5.4.0')
(O/'astra-coverage-summary.json').write_text(json.dumps(sumry,ensure_ascii=False,indent=2))
