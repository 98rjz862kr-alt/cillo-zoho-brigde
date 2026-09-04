import json
from rrx.operations import PlatformDashboard, PartnerDashboard, RunbookRegistry, OnCallPolicy, BackupVerifier, IncidentTabletop, ServiceStatus, ReleaseFreeze
from rrx.errors import StateError

BUILD_ID='RRX-V0.16-20260904T080143Z-109a493df0b1'
SOURCE_COMMIT='9005d597c82e0a69f8b7d0bc06f6059fb411d6cd'
SOURCE_REPO='98rjz862kr-alt/lmi-application-privee-integration-contenus'

class Clock:
    def __init__(self,t=1000): self.t=t
    def now(self): return self.t
    def advance(self,n): self.t+=n

c=Clock(); d=PlatformDashboard(c.now); assert d.snapshot()['telemetry_status']=='TELEMETRY_MISSING'; d.publish_build(BUILD_ID); d.record('errors',0); d.record('latency_ms',20); d.record('queue_saturation',.1); assert d.snapshot()['telemetry_status']=='OK'
pd=PartnerDashboard(); pd.update('P1','DOWN',999,RuntimeError('secret: detail')); assert 'secret' not in str(pd.snapshot()).lower()
rb=RunbookRegistry(); rb.register('rb1',['isolate','rollback','notify']); rb.link('P0','rb1'); assert rb.exercise('P0',['isolate','rollback','notify'])['status']=='PASS'
try: rb.exercise('P0',['isolate'])
except StateError: pass
else: raise AssertionError('incomplete runbook accepted')
c=Clock(); oc=OnCallPolicy(['L1','L2'],60,c.now); oc.open('i1'); c.advance(61); assert oc.tick('i1')['level']==1
restored={}; bv=BackupVerifier(lambda p:(restored.update(p) or restored.copy())); bv.add('b1',{'cases':3}); assert bv.verify_and_restore('b1')['restored']['cases']==3
assert IncidentTabletop().run('outage',['detect','isolate','restore'],['detect','isolate','restore'])['status']=='PASS'
ss=ServiceStatus(); ss.set('api',True); ss.set('db',False); assert ss.overall()=='DEGRADED'
fr=ReleaseFreeze(); fr.freeze('release-manager',True)
try: fr.mutate_release('release-manager','deploy',True)
except StateError: pass
else: raise AssertionError('release mutation bypassed freeze')
fr.unfreeze('release-manager',True); assert fr.mutate_release('release-manager','deploy',True)
print(json.dumps({'status':'PASS','operations_gates':'H01-H08','build_id':BUILD_ID,'source_repo':SOURCE_REPO,'source_commit':SOURCE_COMMIT}))
