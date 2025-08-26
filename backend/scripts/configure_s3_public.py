#!/usr/bin/env python3
"""
Script para hacer el bucket S3 público para lectura
"""
import boto3
import json

AWS_ACCESS_KEY_ID = 'AKIATI3QXLJ4VE3LBKFN'
AWS_SECRET_ACCESS_KEY = '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'
AWS_REGION = 'sa-east-1'
S3_BUCKET_NAME = 'sisbarrios'

print("🔧 Configurando bucket S3 para acceso público...")

s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

# 1. Desactivar "Block all public access"
try:
    s3_client.delete_public_access_block(Bucket=S3_BUCKET_NAME)
    print("✅ Block public access desactivado")
except Exception as e:
    print(f"⚠️ Error desactivando block public access: {e}")

# 2. Configurar la política del bucket para permitir lectura pública
bucket_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": f"arn:aws:s3:::{S3_BUCKET_NAME}/*"
        }
    ]
}

try:
    s3_client.put_bucket_policy(
        Bucket=S3_BUCKET_NAME,
        Policy=json.dumps(bucket_policy)
    )
    print("✅ Política de lectura pública configurada")
except Exception as e:
    print(f"❌ Error configurando política: {e}")

# 3. Verificar configuración
try:
    policy = s3_client.get_bucket_policy(Bucket=S3_BUCKET_NAME)
    print("\n📋 Política actual del bucket:")
    print(json.dumps(json.loads(policy['Policy']), indent=2))
except Exception as e:
    print(f"⚠️ Error obteniendo política: {e}")

print("\n✅ Configuración completada!")
print(f"🌐 Las imágenes ahora deberían ser accesibles en:")
print(f"   https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/gastro/products/")
print("\n🔍 Prueba con:")
print(f"   https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/gastro/products/hamburguesa-clasica.jpg")