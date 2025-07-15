# -*- coding: utf-8 -*-
"""
最基础地图积分计算模块（无排名加成，仅时间和难度）
"""

def get_k(level):
    level = str(level).replace(' ', '')
    if level in ['入门', '初级']:
        return 25
    elif level in ['中级', '中级+']:
        return 50
    elif level in ['高级', '高级+']:
        return 100
    elif level in ['骨灰', '骨灰+']:
        return 150
    elif level in ['火星', '火星+']:
        return 200
    elif level.startswith('极限'):
        return 250
    elif level.startswith('死亡'):
        return 300
    else:
        return 50  # 默认

def calc_score_simple(x, t1, k, rank):
    if rank == 1:
        return 1000
    elif rank <= 20:
        return min(999, k + (1000 - k) * (t1 / x) ** 0.5)
    else:
        return min(999, k + (1000 - k) * (t1 / x) ** 2)

def calc_all_scores_simple(records, level):
    """
    records: list of dict, 每条dict至少包含 'user_id', 'time', 'map_id'
    level: 地图难度
    返回: 新的records列表，增加'score'字段
    """
    if not records:
        return []
    records_sorted = sorted(records, key=lambda r: (r['time'], r.get('upload_time', 0)))
    t1 = records_sorted[0]['time']
    k = get_k(level)
    for idx, r in enumerate(records_sorted):
        rank = idx + 1
        r['score'] = round(calc_score_simple(r['time'], t1, k, rank))
        r['rank'] = rank
    return records_sorted 