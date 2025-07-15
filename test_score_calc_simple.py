# -*- coding: utf-8 -*-
from score_calc_simple import calc_all_scores_simple

def main():
    print("=== 基础地图积分计算测试（无排名加成） ===")
    while True:
        level = input("\n请输入地图难度（如 入门/初级/中级/高级/骨灰/火星/极限/死亡...，输入ESC退出）：").strip()
        if level.lower() == 'esc':
            print("已退出。"); break
        records = []
        print("请输入成绩，格式：user_id,时间(秒)[,上传时间戳]。输入空行结束，ESC退出。")
        while True:
            line = input("成绩：")
            if line.strip().lower() == 'esc':
                print("已退出。"); return
            if not line.strip():
                break
            try:
                parts = line.strip().split(',')
                user_id = int(parts[0])
                t = float(parts[1])
                rec = {'user_id': user_id, 'time': t, 'map_id': 1}
                if len(parts) > 2:
                    rec['upload_time'] = float(parts[2])
                records.append(rec)
            except Exception as e:
                print("格式错误，请输入 user_id,时间(秒)[,上传时间戳] 例如 1,83.03 或 1,83.03,1710000000")
        if not records:
            print("无有效成绩，本轮已跳过。"); continue
        result = calc_all_scores_simple(records, level)
        print("\n=== 计算结果 ===")
        for r in result:
            print(f"user {r['user_id']} time {r['time']} score {r['score']}")
        print("\n按回车继续新一轮测试，或输入ESC退出。")
        cont = input().strip()
        if cont.lower() == 'esc':
            print("已退出。"); break

if __name__ == '__main__':
    main() 