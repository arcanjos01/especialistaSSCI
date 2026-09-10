import subprocess,time,json,os
start=time.monotonic()
p=subprocess.run(['python3','-m','unittest','discover','-s','tests','-v'],cwd='/home/cbmsc/especialistaSSCI',env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
open('/tmp/astra-engine-suite.log','w').write(p.stdout)
print(json.dumps({'command':'PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v','returncode':p.returncode,'seconds':round(time.monotonic()-start,3),'tail':p.stdout[-700:]},indent=2))
