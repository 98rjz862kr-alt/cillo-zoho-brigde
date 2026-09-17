import hashlib, json, time
from dataclasses import dataclass
from .errors import StateError

@dataclass
class MetricPoint:
    name: str
    value: float | None
    timestamp: float

class PlatformDashboard:
    def __init__(self, now_fn=time.time):
        self.now=now_fn; self.metrics={}; self.build_id=None
    def publish_build(self,build_id): self.build_id=build_id
    def record(self,name,value): self.metrics[name]=MetricPoint(name,value,self.now())
    def snapshot(self):
        required=('errors','latency_ms','queue_saturation')
        data={'build_id':self.build_id,'metrics':{k:(self.metrics[k].value if k in self.metrics else None) for k in required}}
        data['telemetry_status']='OK' if self.build_id and all(data['metrics'][k] is not None for k in required) else 'TELEMETRY_MISSING'
        return data

class PartnerDashboard:
    def __init__(self): self.rows={}
    def update(self,partner_id,health,freshness_seconds,error=None):
        safe_error=None if error is None else type(error).__name__ if isinstance(error,Exception) else str(error).split(':',1)[0]
        self.rows[partner_id]={'health':health,'freshness_seconds':freshness_seconds,'error':safe_error}
    def snapshot(self): return json.loads(json.dumps(self.rows))

class RunbookRegistry:
    def __init__(self): self.runbooks={}; self.alert_links={}
    def register(self,runbook_id,steps):
        if not steps or any(not str(x).strip() for x in steps): raise StateError('incomplete runbook')
        self.runbooks[runbook_id]=tuple(steps)
    def link(self,alert_code,runbook_id):
        if runbook_id not in self.runbooks: raise StateError('missing runbook')
        self.alert_links[alert_code]=runbook_id
    def exercise(self,alert_code,completed_steps):
        rid=self.alert_links.get(alert_code)
        if not rid: raise StateError('critical alert has no runbook')
        expected=self.runbooks[rid]
        if tuple(completed_steps)!=expected: raise StateError('runbook incomplete')
        return {'alert_code':alert_code,'runbook_id':rid,'status':'PASS'}

@dataclass
class EscalationEvent:
    at: float
    target: str
    reason: str

class OnCallPolicy:
    def __init__(self,levels,ack_deadline=300,now_fn=time.time):
        if len(levels)<2: raise StateError('escalation requires at least two levels')
        self.levels=list(levels); self.ack_deadline=ack_deadline; self.now=now_fn; self.incidents={}
    def open(self,incident_id):
        self.incidents[incident_id]={'opened':self.now(),'acked':False,'level':0,'events':[EscalationEvent(self.now(),self.levels[0],'OPEN')]}; return self.incidents[incident_id]
    def ack(self,incident_id): self.incidents[incident_id]['acked']=True
    def tick(self,incident_id):
        inc=self.incidents[incident_id]
        if not inc['acked'] and self.now()-inc['opened']>=self.ack_deadline and inc['level']<len(self.levels)-1:
            inc['level']+=1; inc['events'].append(EscalationEvent(self.now(),self.levels[inc['level']],'NO_ACK_ESCALATION'))
        return inc

class BackupVerifier:
    def __init__(self,restore_fn): self.restore_fn=restore_fn; self.backups={}; self.alerts=[]
    def add(self,backup_id,payload,checksum=None):
        raw=json.dumps(payload,sort_keys=True,separators=(',',':')).encode(); sha=checksum or hashlib.sha256(raw).hexdigest(); self.backups[backup_id]={'payload':payload,'checksum':sha}; return sha
    def verify_and_restore(self,backup_id):
        rec=self.backups.get(backup_id)
        if not rec: self.alerts.append('BACKUP_MISSING'); raise StateError('backup missing')
        raw=json.dumps(rec['payload'],sort_keys=True,separators=(',',':')).encode()
        if hashlib.sha256(raw).hexdigest()!=rec['checksum']:
            self.alerts.append('BACKUP_CORRUPT'); raise StateError('backup corrupt')
        restored=self.restore_fn(json.loads(json.dumps(rec['payload']))); return {'status':'PASS','restored':restored}

class IncidentTabletop:
    def run(self,scenario,actions,critical_actions):
        timeline=[]
        for idx,action in enumerate(actions): timeline.append({'order':idx+1,'action':action})
        missed=[x for x in critical_actions if x not in actions]
        corrective=[{'action':x,'reason':'MISSED_CRITICAL_ACTION'} for x in missed]
        return {'scenario':scenario,'timeline':timeline,'corrective_actions':corrective,'status':'PASS' if not missed else 'CORRECTIVE_ACTION_REQUIRED'}

class ServiceStatus:
    def __init__(self): self.components={}
    def set(self,name,healthy): self.components[name]=bool(healthy)
    def overall(self):
        if not self.components: return 'UNKNOWN'
        return 'OPERATIONAL' if all(self.components.values()) else 'DEGRADED'
    def snapshot(self): return {'overall':self.overall(),'components':dict(self.components)}

class ReleaseFreeze:
    def __init__(self): self.frozen=False; self.audit=[]
    def freeze(self,actor,authorized=False):
        if not authorized: raise StateError('unauthorized release freeze')
        self.frozen=True; self.audit.append(('FREEZE',actor)); return True
    def unfreeze(self,actor,authorized=False):
        if not authorized: raise StateError('unauthorized release unfreeze')
        self.frozen=False; self.audit.append(('UNFREEZE',actor)); return True
    def mutate_release(self,actor,operation,authorized=False):
        if not authorized: raise StateError('unauthorized release mutation')
        if self.frozen: raise StateError('release frozen')
        self.audit.append(('MUTATION',actor,operation)); return True
