import sys, json, re, importlib.util
from pathlib import Path
ROOT=Path('/home/cbmsc/especialistaSSCI')
sys.path.insert(0,str(ROOT))
def module(name,path):
 s=importlib.util.spec_from_file_location(name, ROOT/path); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
b=module('builder','tools/build_knowledge_base_release.py')
a=module('app','tests/test_applicability_resolution.py')
g=module('guard','tests/test_execution_pipeline_minimal_guard.py')
p=module('proj','tests/test_irv_operational_projection.py')
texts={n:(ROOT/'knowledge-base'/n).read_text() for n in ['02_requirements.txt','03_table1.txt','04_table4.txt']}
r=texts['02_requirements.txt']; t1=texts['03_table1.txt'];t4=texts['04_table4.txt']
req_order=b.parse_requirements(r)
crit=b.parse_criteria(t1)+b.parse_criteria(t4)
tables={cid:'1' for cid,_,_ in b.parse_criteria(t1)}|{cid:'4' for cid,_,_ in b.parse_criteria(t4)}
byreq={rid:[] for rid,_ in req_order}
for cid,rid,_ in crit:byreq[rid].append(cid)
metadata=a.requirement_metadata(r)
fixture=a.ApplicabilityResolutionContractTests()
ledgers=[]
for name,codes,date in [('minimal',(), '2026-08-03'),('gas_ai_current',('IGC','AI','IEL'),'2026-08-03'),('all_official_current',tuple(a.OFFICIAL_MAP),'2026-08-03'),('iel_legacy',('IEL',),'2024-04-24'),('iel_unresolved',('IEL',),None)]:
 d=fixture.current_document(codes,request_date=date)
 resolution=a.productive_resolution([d],fixture.current_identifiers())
 chosen=a.applicable_requirement_ids(metadata,resolution['process_smsci'],resolution['in19_documentation_regime'])
 reqs=[rid for rid,_ in req_order if rid in chosen]
 keys=[(rid,cid) for rid in reqs for cid in byreq[rid]]
 sequence=[tables[cid] for _,cid in keys]
 first4=sequence.index('4') if '4' in sequence else len(sequence)
 late_t1=[cid for _,cid in keys[first4:] if tables[cid]=='1']
 ledgers.append({'case':name,'EXPECTED_REQUIREMENTS_source':'02a + requirement metadata (not independent normative oracle)','EXPECTED_REQUIREMENTS':reqs,'PLANNED_REQUIREMENTS':list(dict.fromkeys(rid for rid,_ in keys)), 'PLANNED_UNITS':[{'UNIT_KEY':key,'TABLE':tables[key[1]]} for key in keys], 'EXECUTED_CRITERIA':None,'RESULTS':None,'PROJECTED_RESULTS':None,'REPORTED_RESULTS':None,'unexecuted_reason':'No local end-to-end operational Gem/extractor/DSL executor. Closed plan has conflicting mandatory Table order.','ORDER_CONFLICT_TABLE1_AFTER_TABLE4':late_t1})
# Probe test-model validation (not operational).
app={'A':{},'B':{}}; cs={'A':['A1'],'B':['B1']}; plan=g.build_plan(app,cs)
g.validate_plan(app,cs,plan[::-1])
blank=fixture.current_document(('IGC',),trace={'process_memory_fact':'','rde_record':None,'source_document':''})
blank_result=a.productive_resolution([blank], fixture.current_identifiers())
nullids=fixture.current_document(('IGC',),identifiers={'REQUEST_IDENTIFIER':None})
null_result=a.productive_resolution([nullids], {'REQUEST_IDENTIFIER':None})
# Projection-only ledger input is explicitly synthetic, no inferred execution.
projection_cases=[]
for ids in [['NC_T4_002','NC_T4_003'],['NC_T1_009','NC_T4_019','NC_T4_002'],['NC_T1_001','NC_T1_003'],['NC_T1_004','NC_T4_017']]:
 pending,human=p.project(ids)
 projection_cases.append({'synthetic_consolidated_fail_ids':ids,'projected':pending,'human':human,'reported':None,'scope':'Reference-test helper only; no Gemini rendering performed'})
# Proven duplicate behavior is guarded in deployable builder.
duplicate_errors=[]
for name,rt,ct1,ct4 in [('duplicate_req',r+'\nREQUIREMENT REQ_T1_DRT_REQUIRED\nEND\n',t1,t4),('duplicate_criterion',r,t1,t4+'\nCRITERION T1_DRT_REQUIRED\nREQUIREMENT REQ_T1_DRT_REQUIRED\nEND\n')]:
 try:b.compile_execution_index(rt,ct1,ct4)
 except ValueError as e:duplicate_errors.append({'case':name,'error':str(e)})
result={'baseline':'9d2e7f175507a4e81e3ed80d7ef57e89d73124d1','ledgers':ledgers,'reference_test_model_gaps':{'reversed_plan_accepted':True,'empty_provenance_accepted':blank_result,'null_request_identifier_matches':null_result},'projection_ledgers':projection_cases,'duplicate_builder_rejections':duplicate_errors}
Path('/tmp/astra-pipeline-ledgers.json').write_text(json.dumps(result,ensure_ascii=False,indent=2,default=lambda x:sorted(x)))
print(json.dumps({'cases':[{k:v for k,v in l.items() if k in ('case','ORDER_CONFLICT_TABLE1_AFTER_TABLE4')}|{'requirements':len(l['EXPECTED_REQUIREMENTS']),'units':len(l['PLANNED_UNITS'])} for l in ledgers],'helper_gaps':['reversed plan accepted','blank provenance accepted','null strong identifier matches'],'duplicate_builder_rejections':duplicate_errors},ensure_ascii=False,indent=2))
