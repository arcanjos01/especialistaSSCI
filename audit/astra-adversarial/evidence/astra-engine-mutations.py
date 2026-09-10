import pathlib,shutil,subprocess,time,os,json
root=pathlib.Path('/home/cbmsc/especialistaSSCI'); dest=pathlib.Path('/tmp/astra-engine-mutation-copy');dest.mkdir(exist_ok=True)
for d in ('engine','tests','knowledge-base','docs','tools','references'):
 shutil.copytree(root/d,dest/d,dirs_exist_ok=True)
for f in ('AGENTS.md','instruções_gem.txt'):shutil.copy2(root/f,dest/f)
f=dest/'engine/criterion_ir.py';original=f.read_text()
mutants={
 'drop_trace_memory_references':('memory_references=tuple(_references_in(arguments)),','memory_references=(),'),
 'memory_no_constructor_deepcopy':('{key: deepcopy(value) for key, value in source.items()}','{key: value for key, value in source.items()}'),
 'memory_no_read_deepcopy':('return deepcopy(self._values[reference])','return self._values[reference]'),
 'registry_allow_duplicate_shadowing':('if contract.predicate_id in entries:','if False:'),
 'ignore_applicability':('if criterion.applicability is not None:','if False:'),
 'forall_becomes_or':('return All(self.expressions).evaluate(engine, process_memory, context)','return Or(self.expressions).evaluate(engine, process_memory, context)'),
 'unknown_in_all_becomes_false':('if EngineResult.UNKNOWN in values:\n        return EngineResult.UNKNOWN\n    return EngineResult.TRUE','if EngineResult.UNKNOWN in values:\n        return EngineResult.FALSE\n    return EngineResult.TRUE'),
 'skip_predicate_arg_validation':('arguments = contract.argument_schema.validate(self.arguments)','arguments = self.arguments'),
}
results=[]
for name,(a,b) in mutants.items():
 assert original.count(a)==1,(name,original.count(a)); f.write_text(original.replace(a,b)); start=time.monotonic()
 p=subprocess.run(['python3','-m','unittest','discover','-s','tests','-v'],cwd=dest,env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
 (pathlib.Path('/tmp')/('astra-engine-mutation-'+name+'.log')).write_text(p.stdout)
 results.append({'mutation':name,'target':'engine/criterion_ir.py','before':a,'after':b,'status':'SURVIVED' if p.returncode==0 else 'KILLED','seconds':round(time.monotonic()-start,3),'tail':p.stdout[-150:]})
 f.write_text(original)
print(json.dumps(results,indent=2))
