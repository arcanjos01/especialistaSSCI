import importlib.util,json,sys
from pathlib import Path
ROOT=Path('/home/cbmsc/especialistaSSCI')
def mod(name,file):
 s=importlib.util.spec_from_file_location(name,ROOT/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
a=mod('app','tests/test_applicability_resolution.py')
b=mod('builder','tools/build_knowledge_base_release.py')
f=a.ApplicabilityResolutionContractTests()
kb=ROOT/'knowledge-base'
metadata=a.requirement_metadata((kb/'02_requirements.txt').read_text())
criteria=b.parse_criteria((kb/'03_table1.txt').read_text())+b.parse_criteria((kb/'04_table4.txt').read_text())
cases=[]
for ident,reqdate,completion,codes,evidence,expected in [
 ('IN19-OLD-NEW-REQUEST','2026-08-03','2020-01-01',['IEL'],['maintenance_DRT_2025'],'IN19 art18 par único: documentação substitutiva admitida; data de solicitação não exclui esse direito'),
 ('IN19-CURRENT-MISSING','2026-08-03','2025-01-01',['IEL'],[],'IN19 art18 caput: execução, aterramento e verificação final'),
 ('IN19-LEGACY-MISSING','2024-04-23','2020-01-01',['IEL'],[],'Obrigações documentais permanecem; nenhum atendimento demonstrado'),
 ('IN19-LEGACY-EXECUTION','2024-04-23','2020-01-01',['IEL'],['execution_DRT'],'IN19 art18 par único: execução é uma alternativa, sem exigir dois DRT adicionais'),
 ('IN19-UNRESOLVED',None,'2020-01-01',['IEL'],['maintenance_DRT_2023'],'Preservar insuficiência do marco usado pela Base; revisão humana'),
 ('IN19-IEL-ABSENT','2026-08-03','2020-01-01',[],[],'Base declara revisão de aplicabilidade; ausência IEL não dispensa IN19'),
 ('IN10-NATURAL','2026-08-03','2025-01-01',['CF'],[],'IRV p9 exige comissionamento IN10 quando mecânico; CF natural não satisfaz essa condição'),
]:
 d=f.current_document(tuple(codes),request_date=reqdate)
 # The completion fact is a documentary counterexample input. The current resolver explicitly ignores it.
 d['documentary_completion_date']=completion
 resolution=a.productive_resolution([d],f.current_identifiers())
 chosen=sorted(a.applicable_requirement_ids(metadata,resolution['process_smsci'],resolution['in19_documentation_regime']))
 selected=[cid for cid,rid,_ in criteria if rid in chosen]
 cases.append(dict(id=ident,request_date=reqdate,documentary_completion_date=completion,codes=codes,evidence=evidence,normative_expected=expected,observed_scope=sorted(resolution['process_smsci']),observed_regime=resolution['in19_documentation_regime'],planned_requirements=chosen,planned_criteria=selected,execution_status='not executed end-to-end; current test helper used only for selection'))
assert cases[0]['observed_regime']=='CURRENT'
assert 'REQ_IN19_LEGACY_DOCUMENTATION' not in cases[0]['planned_requirements']
assert 'REQ_IN10_COMMISSIONING' in cases[-1]['planned_requirements']
boundaries={s:a.in19_documentation_regime(f.current_document(('IEL',),request_date=s),{'SMSCI_IEL':'POSITIVE'}) for s in ['2024-04-23','2024-04-24','2024-04-25','2024-02-30',None]}
legacy={str(x):a.legacy_documentation_result(x) for x in [True,False,None]}
result={'baseline':'9d2e7f175507a4e81e3ed80d7ef57e89d73124d1','oracle':'IN19 p4 art18 and IRV p9; current helper is not normative oracle','cases':cases,'boundary_declared_model':boundaries,'legacy_declared_model':legacy,'limitations':['No Gemini run','No automatic normative date-of-publication assertion from date-of-vigency','No fabricated full execution or report ledger']}
Path('/tmp/astra-normative-probes.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({'cases':len(cases),'counterexamples_confirmed':['IN19-OLD-NEW-REQUEST','IN10-NATURAL'],'boundaries':boundaries,'legacy_results':legacy},ensure_ascii=False))
