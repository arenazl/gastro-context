#!/usr/bin/env python3
"""
Sistema de diagnósticos de crashes para el servidor
Analiza y categoriza errores para tomar decisiones automáticas de recuperación
"""
import time
import json
import os
from datetime import datetime
from collections import defaultdict

class CrashDiagnostics:
    def __init__(self, log_dir):
        self.log_dir = log_dir
        self.error_counts = defaultdict(int)
        self.error_patterns = {}
        self.crash_history = []
        
        # Patrones de errores conocidos y sus soluciones
        self.error_solutions = {
            'pool_exhausted': {
                'description': 'Pool de conexiones MySQL agotado',
                'solutions': ['increase_pool_size', 'recover_pool', 'fallback_connection'],
                'severity': 'HIGH',
                'auto_recovery': True
            },
            'connection_timeout': {
                'description': 'Timeout en conexión a MySQL',
                'solutions': ['increase_timeout', 'retry_connection', 'check_network'],
                'severity': 'MEDIUM',
                'auto_recovery': True
            },
            'mysql_server_gone': {
                'description': 'Servidor MySQL desconectado',
                'solutions': ['reconnect_mysql', 'check_mysql_status', 'failover_db'],
                'severity': 'CRITICAL',
                'auto_recovery': True
            },
            'memory_exhausted': {
                'description': 'Memoria del sistema agotada',
                'solutions': ['garbage_collection', 'reduce_pool_size', 'restart_server'],
                'severity': 'CRITICAL',
                'auto_recovery': False
            },
            'port_already_in_use': {
                'description': 'Puerto ya en uso',
                'solutions': ['kill_existing_process', 'use_different_port'],
                'severity': 'MEDIUM',
                'auto_recovery': True
            },
            'disk_full': {
                'description': 'Disco lleno',
                'solutions': ['clean_logs', 'clean_cache', 'expand_storage'],
                'severity': 'CRITICAL',
                'auto_recovery': False
            }
        }
    
    def analyze_error(self, error_message, error_type, traceback_info=None):
        """Analizar un error y determinar su categoría y solución"""
        
        # Crear registro del error
        error_record = {
            'timestamp': datetime.now().isoformat(),
            'error_message': str(error_message),
            'error_type': error_type,
            'traceback': traceback_info
        }
        
        # Categorizar el error
        error_category = self._categorize_error(error_message, error_type)
        error_record['category'] = error_category
        
        # Obtener solución recomendada
        solution_info = self.error_solutions.get(error_category, {
            'description': 'Error no categorizado',
            'solutions': ['log_and_monitor'],
            'severity': 'UNKNOWN',
            'auto_recovery': False
        })
        
        error_record['solution_info'] = solution_info
        
        # Contar ocurrencias
        self.error_counts[error_category] += 1
        error_record['occurrence_count'] = self.error_counts[error_category]
        
        # Agregar al historial
        self.crash_history.append(error_record)
        
        # Mantener solo los últimos 100 errores
        if len(self.crash_history) > 100:
            self.crash_history.pop(0)
        
        # Guardar diagnóstico
        self._save_diagnostic_report(error_record)
        
        return error_record
    
    def _categorize_error(self, error_message, error_type):
        """Categorizar error según patrones conocidos"""
        error_msg_lower = str(error_message).lower()
        
        # Errores del pool de conexiones
        pool_keywords = ['pool exhausted', 'pool is full', 'failed getting connection', 'no connection available']
        if any(keyword in error_msg_lower for keyword in pool_keywords):
            return 'pool_exhausted'
        
        # Errores de timeout
        timeout_keywords = ['timeout', 'connection timed out', 'read timeout', 'connect timeout']
        if any(keyword in error_msg_lower for keyword in timeout_keywords):
            return 'connection_timeout'
        
        # Servidor MySQL caído
        mysql_keywords = ['server has gone away', 'lost connection', 'connection refused', 'can\'t connect to mysql']
        if any(keyword in error_msg_lower for keyword in mysql_keywords):
            return 'mysql_server_gone'
        
        # Memoria agotada
        memory_keywords = ['memory error', 'out of memory', 'memoryerror', 'cannot allocate memory']
        if any(keyword in error_msg_lower for keyword in memory_keywords):
            return 'memory_exhausted'
        
        # Puerto en uso
        port_keywords = ['address already in use', 'port', 'bind failed']
        if any(keyword in error_msg_lower for keyword in port_keywords):
            return 'port_already_in_use'
        
        # Disco lleno
        disk_keywords = ['no space left', 'disk full', 'quota exceeded']
        if any(keyword in error_msg_lower for keyword in disk_keywords):
            return 'disk_full'
        
        return 'unknown_error'
    
    def _save_diagnostic_report(self, error_record):
        """Guardar reporte de diagnóstico en archivo JSON"""
        report_file = os.path.join(self.log_dir, 'crash_diagnostics.json')
        
        # Crear reporte completo
        diagnostic_report = {
            'latest_error': error_record,
            'error_summary': {
                'total_errors': len(self.crash_history),
                'error_counts_by_category': dict(self.error_counts),
                'most_frequent_error': max(self.error_counts, key=self.error_counts.get) if self.error_counts else None
            },
            'recent_errors': self.crash_history[-10:],  # Últimos 10 errores
            'recommendations': self._get_recommendations()
        }
        
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(diagnostic_report, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error guardando reporte de diagnóstico: {e}")
    
    def _get_recommendations(self):
        """Generar recomendaciones basadas en el patrón de errores"""
        recommendations = []
        
        # Análisis de frecuencia de errores
        if self.error_counts:
            most_frequent = max(self.error_counts, key=self.error_counts.get)
            frequency = self.error_counts[most_frequent]
            
            if frequency > 5:
                recommendations.append({
                    'type': 'frequent_error',
                    'message': f"Error más frecuente: {most_frequent} ({frequency} veces)",
                    'suggested_actions': self.error_solutions.get(most_frequent, {}).get('solutions', [])
                })
        
        # Análisis temporal
        recent_errors = self.crash_history[-5:]
        if len(recent_errors) >= 3:
            time_span = (datetime.fromisoformat(recent_errors[-1]['timestamp']) - 
                        datetime.fromisoformat(recent_errors[0]['timestamp'])).total_seconds()
            
            if time_span < 300:  # 5 minutos
                recommendations.append({
                    'type': 'error_burst',
                    'message': f"Múltiples errores en corto tiempo ({time_span:.1f}s)",
                    'suggested_actions': ['restart_server', 'check_system_resources', 'enable_maintenance_mode']
                })
        
        return recommendations
    
    def should_auto_recover(self, error_category):
        """Determinar si se debe intentar recuperación automática"""
        solution_info = self.error_solutions.get(error_category, {})
        
        # No intentar recuperación automática si el error es muy frecuente (posible loop)
        if self.error_counts[error_category] > 10:
            return False
        
        return solution_info.get('auto_recovery', False)
    
    def get_recovery_strategy(self, error_category):
        """Obtener estrategia de recuperación para un tipo de error"""
        solution_info = self.error_solutions.get(error_category, {})
        return {
            'description': solution_info.get('description', 'Error desconocido'),
            'severity': solution_info.get('severity', 'UNKNOWN'),
            'solutions': solution_info.get('solutions', []),
            'auto_recovery': solution_info.get('auto_recovery', False),
            'occurrence_count': self.error_counts[error_category]
        }
    
    def generate_status_report(self):
        """Generar reporte de estado completo"""
        return {
            'system_health': {
                'total_errors': len(self.crash_history),
                'unique_error_types': len(self.error_counts),
                'last_error_time': self.crash_history[-1]['timestamp'] if self.crash_history else None,
                'uptime_status': 'degraded' if len(self.crash_history) > 10 else 'healthy'
            },
            'error_breakdown': dict(self.error_counts),
            'recommendations': self._get_recommendations(),
            'recent_activity': self.crash_history[-5:]
        }