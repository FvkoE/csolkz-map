#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
删除map_apply表中特定数据的脚本
"""

import mysql.connector
import os
import sys

def get_database_config():
    """获取数据库配置"""
    return {
        'host': os.environ.get('DB_HOST'),
        'user': os.environ.get('DB_USER'),
        'password': os.environ.get('DB_PASSWORD'),
        'database': os.environ.get('DB_NAME'),
        'port': int(os.environ.get('DB_PORT', '3306'))
    }

def connect_database():
    """连接数据库"""
    try:
        config = get_database_config()
        # 检查必要的配置
        if not all([config['host'], config['user'], config['password'], config['database']]):
            print("错误：数据库配置不完整！")
            print("请确保设置了以下环境变量：")
            print("DB_HOST, DB_USER, DB_PASSWORD, DB_NAME")
            return None
        
        connection = mysql.connector.connect(**config)
        return connection
    except mysql.connector.Error as err:
        print(f"数据库连接失败: {err}")
        return None

def list_applies():
    """列出所有申请记录"""
    connection = connect_database()
    if not connection:
        return
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("""
        SELECT id, name, mapper, region, level, type, status, create_time, map_id
        FROM map_apply 
        ORDER BY create_time DESC
        """)
        applies = cursor.fetchall()
        
        if not applies:
            print("没有找到任何申请记录")
            return
        
        print("=" * 80)
        print("申请记录列表")
        print("=" * 80)
        print(f"{'ID':<5} {'名称':<20} {'作者':<15} {'大区':<10} {'状态':<8} {'类型':<8} {'创建时间':<20}")
        print("-" * 80)
        
        for apply in applies:
            print(f"{apply['id']:<5} {apply['name']:<20} {apply['mapper']:<15} {apply['region']:<10} {apply['status']:<8} {apply['type']:<8} {apply['create_time'].strftime('%Y-%m-%d %H:%M')}")
        
        print("=" * 80)
        
    except mysql.connector.Error as err:
        print(f"查询失败: {err}")
    finally:
        cursor.close()
        connection.close()

def show_apply_detail(apply_id):
    """显示申请详情"""
    connection = connect_database()
    if not connection:
        return
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("""
        SELECT id, name, mapper, region, level, type, status, create_time, map_id, note, image
        FROM map_apply 
        WHERE id = %s
        """, (apply_id,))
        
        apply = cursor.fetchone()
        
        if not apply:
            print(f"未找到ID为 {apply_id} 的申请记录")
            return
        
        print("=" * 60)
        print(f"申请记录详情 (ID: {apply['id']})")
        print("=" * 60)
        print(f"地图名称: {apply['name']}")
        print(f"作者: {apply['mapper']}")
        print(f"大区: {apply['region']}")
        print(f"难度: {apply['level']}")
        print(f"类型: {apply['type']}")
        print(f"状态: {apply['status']}")
        print(f"创建时间: {apply['create_time']}")
        print(f"关联地图ID: {apply['map_id'] if apply['map_id'] else '无'}")
        print(f"备注: {apply['note'] if apply['note'] else '无'}")
        print(f"图片: {apply['image'] if apply['image'] else '无'}")
        print("=" * 60)
        
    except mysql.connector.Error as err:
        print(f"查询失败: {err}")
    finally:
        cursor.close()
        connection.close()

def delete_apply(apply_id):
    """删除申请记录"""
    connection = connect_database()
    if not connection:
        return
    
    cursor = connection.cursor()
    
    try:
        # 先检查申请记录是否存在
        cursor.execute("SELECT id, name, status FROM map_apply WHERE id = %s", (apply_id,))
        apply = cursor.fetchone()
        
        if not apply:
            print(f"未找到ID为 {apply_id} 的申请记录")
            return
        
        print(f"准备删除申请记录:")
        print(f"  ID: {apply[0]}")
        print(f"  名称: {apply[1]}")
        print(f"  状态: {apply[2]}")
        
        # 确认删除
        confirm = input("\n确定要删除这条申请记录吗？(输入 'yes' 确认): ")
        if confirm.lower() != 'yes':
            print("删除操作已取消")
            return
        
        # 检查是否有历史记录引用此申请
        cursor.execute("SELECT COUNT(*) FROM map_history WHERE origin_apply_id = %s", (apply_id,))
        history_count = cursor.fetchone()[0]
        
        if history_count > 0:
            print(f"⚠️  警告：有 {history_count} 条历史记录引用了此申请")
            confirm2 = input("删除申请后，相关历史记录的origin_apply_id将设为NULL。继续吗？(输入 'yes' 确认): ")
            if confirm2.lower() != 'yes':
                print("删除操作已取消")
                return
            
            # 先将历史记录中的origin_apply_id设为NULL
            cursor.execute("UPDATE map_history SET origin_apply_id = NULL WHERE origin_apply_id = %s", (apply_id,))
            print(f"已更新 {cursor.rowcount} 条历史记录")
        
        # 删除申请记录
        cursor.execute("DELETE FROM map_apply WHERE id = %s", (apply_id,))
        
        if cursor.rowcount > 0:
            connection.commit()
            print(f"✓ 成功删除申请记录 (ID: {apply_id})")
        else:
            print("删除失败")
            
    except mysql.connector.Error as err:
        connection.rollback()
        print(f"删除过程中出现错误: {err}")
    finally:
        cursor.close()
        connection.close()

def batch_delete_applies():
    """批量删除申请记录"""
    connection = connect_database()
    if not connection:
        return
    
    cursor = connection.cursor()
    
    try:
        # 显示可删除的申请记录
        cursor.execute("""
        SELECT id, name, status, create_time 
        FROM map_apply 
        WHERE status IN ('通过', '拒绝')
        ORDER BY create_time DESC
        """)
        applies = cursor.fetchall()
        
        if not applies:
            print("没有找到可删除的申请记录（只有通过或拒绝状态的申请可以删除）")
            return
        
        print("可删除的申请记录（已通过或拒绝）:")
        print("-" * 60)
        for apply in applies:
            print(f"ID: {apply[0]}, 名称: {apply[1]}, 状态: {apply[2]}, 时间: {apply[3]}")
        
        print("\n批量删除选项:")
        print("1. 删除所有已通过的申请")
        print("2. 删除所有已拒绝的申请")
        print("3. 删除所有已处理的申请（通过+拒绝）")
        print("4. 删除指定时间之前的已处理申请")
        
        choice = input("\n请选择操作 (1-4): ")
        
        if choice == '1':
            confirm = input("确定要删除所有已通过的申请吗？(输入 'yes' 确认): ")
            if confirm.lower() == 'yes':
                cursor.execute("DELETE FROM map_apply WHERE status = '通过'")
                deleted_count = cursor.rowcount
                connection.commit()
                print(f"✓ 成功删除 {deleted_count} 条已通过的申请")
        
        elif choice == '2':
            confirm = input("确定要删除所有已拒绝的申请吗？(输入 'yes' 确认): ")
            if confirm.lower() == 'yes':
                cursor.execute("DELETE FROM map_apply WHERE status = '拒绝'")
                deleted_count = cursor.rowcount
                connection.commit()
                print(f"✓ 成功删除 {deleted_count} 条已拒绝的申请")
        
        elif choice == '3':
            confirm = input("确定要删除所有已处理的申请吗？(输入 'yes' 确认): ")
            if confirm.lower() == 'yes':
                cursor.execute("DELETE FROM map_apply WHERE status IN ('通过', '拒绝')")
                deleted_count = cursor.rowcount
                connection.commit()
                print(f"✓ 成功删除 {deleted_count} 条已处理的申请")
        
        elif choice == '4':
            days = input("请输入天数（删除多少天前的已处理申请）: ")
            try:
                days = int(days)
                confirm = input(f"确定要删除 {days} 天前的已处理申请吗？(输入 'yes' 确认): ")
                if confirm.lower() == 'yes':
                    cursor.execute("""
                    DELETE FROM map_apply 
                    WHERE status IN ('通过', '拒绝') 
                    AND create_time < DATE_SUB(NOW(), INTERVAL %s DAY)
                    """, (days,))
                    deleted_count = cursor.rowcount
                    connection.commit()
                    print(f"✓ 成功删除 {deleted_count} 条 {days} 天前的已处理申请")
            except ValueError:
                print("请输入有效的数字")
        
        else:
            print("无效的选择")
            
    except mysql.connector.Error as err:
        connection.rollback()
        print(f"批量删除过程中出现错误: {err}")
    finally:
        cursor.close()
        connection.close()

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("使用方法:")
        print("  python delete_apply.py list                    # 列出所有申请")
        print("  python delete_apply.py show <ID>              # 显示申请详情")
        print("  python delete_apply.py delete <ID>            # 删除指定申请")
        print("  python delete_apply.py batch                  # 批量删除")
        return
    
    command = sys.argv[1]
    
    if command == "list":
        list_applies()
    
    elif command == "show":
        if len(sys.argv) < 3:
            print("请提供申请ID")
            return
        try:
            apply_id = int(sys.argv[2])
            show_apply_detail(apply_id)
        except ValueError:
            print("请提供有效的申请ID（数字）")
    
    elif command == "delete":
        if len(sys.argv) < 3:
            print("请提供申请ID")
            return
        try:
            apply_id = int(sys.argv[2])
            delete_apply(apply_id)
        except ValueError:
            print("请提供有效的申请ID（数字）")
    
    elif command == "batch":
        batch_delete_applies()
    
    else:
        print("无效的命令")

if __name__ == "__main__":
    main() 