import sys,json,itertools
sys.path.insert(0,'/home/cbmsc/especialistaSSCI')
from engine.criterion_ir import *
from engine.cbmsc_predicates import ProfessionalRegularityResolver, PREDICATE_ID
ctx=ResolverContext('AUDIT_C','AUDIT_R'); ref=TypedReference('ENTITY','one'); mem=ImmutableProcessMemory({ref:{'nested':[1]}})
class Static(DomainPredicateResolver):
 def __init__(self,v):self.v=v
 def resolve(self,a,m,c):return self.v
states=(EngineResult.TRUE,EngineResult.FALSE,EngineResult.UNKNOWN,EngineResult.MANUAL_REVIEW)
cs=[PredicateContract(s.value,ArgumentSchema(),frozenset({s}),Static(s)) for s in states]
e=Engine(PredicateRegistry(cs)); out={}
# Independent oracle is ordered dominance in Documento 10 lines 466-472.
checks=0
for op,dominance in ((All,(EngineResult.FALSE,EngineResult.MANUAL_REVIEW,EngineResult.UNKNOWN,EngineResult.TRUE)),(Or,(EngineResult.TRUE,EngineResult.MANUAL_REVIEW,EngineResult.UNKNOWN,EngineResult.FALSE))):
 for n in range(1,4):
  for vals in itertools.product(states,repeat=n):
   actual=e.evaluate_expression(op([PredicateCall(v.value,{}) for v in vals]),mem,ctx).result
   expected=next(v for v in dominance if v in vals)
   assert actual==expected,(op,vals,actual,expected); checks+=1
out['composition_oracle_checks']=checks
out['empty_operators']={op.__name__:e.evaluate_expression(op([]),mem,ctx).result.value for op in (All,Or,ForEach)}
# Normal public memory API must sever aliases at both entry and return.
source={'nested':[1]}; m=ImmutableProcessMemory({ref:source}); source['nested'][0]=9; read=m.read(ref); read['nested'][0]=8
out['public_memory_alias_isolation']=m.read(ref)
# Registry public constructor accepts mutable set despite annotation; frozen dataclass does not freeze it.
allowed={EngineResult.TRUE}; resolver=Static(EngineResult.FALSE); pc=PredicateContract('MUTABLE_ALLOWED',ArgumentSchema(),allowed,resolver); reg=PredicateRegistry([pc]); allowed.add(EngineResult.FALSE)
out['allowed_result_contract_mutated_after_registry']=Engine(reg).evaluate_predicate('MUTABLE_ALLOWED',{},mem,ctx).result.value
try:PredicateContract('DECLARED_NA',ArgumentSchema(),frozenset({EngineResult.NOT_APPLICABLE}),Static(EngineResult.NOT_APPLICABLE))
except Exception as ex:out['explicit_na_contract']=type(ex).__name__+': '+str(ex)
# Completed trace arguments retain mutable nested aliases received at constructor.
args={'payload':{'values':[1]}};pc=PredicateContract('NESTED',ArgumentSchema((ArgumentSpec('payload',ArgumentKind.ANY),)),frozenset({EngineResult.TRUE}),Static(EngineResult.TRUE)); expr=PredicateCall('NESTED',args);ev=Engine(PredicateRegistry([pc])).evaluate_expression(expr,mem,ctx);args['payload']['values'].append(2)
out['trace_arguments_after_caller_mutation']=dict(ev.trace[0].arguments)
# FALSE can leave generic evaluator without NC or evidence.
criterion=CriterionIR('C','R',None,PredicateCall('FALSE',{}),EngineResult.TRUE,None,Traceability())
ev=e.evaluate_criterion(criterion,ImmutableProcessMemory())
out['false_without_evidence_or_nc']={'result':ev.result.value,'refs':len(ev.trace[0].memory_references),'evaluation_fields':list(ev.__dataclass_fields__)}
# Domain pilot: duplicate and complementary/mixed DRT evidence; no new normative fixtures.
r=TypedReference('REQUIRED_TECHNICAL_RESPONSIBILITY','RTR');d1=TypedReference('DRT','D1');d2=TypedReference('DRT','D2')
contract=PredicateContract(PREDICATE_ID,ArgumentSchema((ArgumentSpec('subject',ArgumentKind.REFERENCE),)),frozenset(states),ProfessionalRegularityResolver()); de=Engine(PredicateRegistry([contract]))
def run(refs):
 pm=ImmutableProcessMemory({r:{'drt_evidence':refs},d1:{'COUNCIL_STATE':'SC','PROFESSIONAL_REGULARITY':'IRREGULAR'},d2:{'COUNCIL_STATE':'SC','PROFESSIONAL_REGULARITY':'REGULAR'}})
 ev=de.evaluate_predicate(PREDICATE_ID,{'subject':r},pm,ctx)
 return {'result':ev.result.value,'trace_refs':[x.identifier for x in ev.trace[0].memory_references]}
out['pilot_cardinality']={'one_irregular':run((d1,)),'duplicate_same_irregular':run((d1,d1)),'irregular_plus_regular':run((d1,d2)),'reverse':run((d2,d1)),'empty':run(())}
# Exact transcription of imperative VALIDATE transitions in 00_engine 311-328, not production Python.
def engine_text_fold(vals):
 result=EngineResult.TRUE
 for v in vals:
  if v==EngineResult.FALSE:result=v
  elif v==EngineResult.MANUAL_REVIEW:result=v
  elif v==EngineResult.UNKNOWN and result!=EngineResult.FALSE:result=v
 return result.value
out['engine_text_validate_order']={'FALSE_MR':engine_text_fold((EngineResult.FALSE,EngineResult.MANUAL_REVIEW)),'MR_FALSE':engine_text_fold((EngineResult.MANUAL_REVIEW,EngineResult.FALSE)),'MR_UNKNOWN':engine_text_fold((EngineResult.MANUAL_REVIEW,EngineResult.UNKNOWN))}
print(json.dumps(out,indent=2))
