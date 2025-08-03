import psycopg2

# Connect to database
conn = psycopg2.connect('postgresql://postgres:UxI:dxl81yG]uBK:rU<U<sUdm5EZ@bluebank-db.ca76eoy2kz8t.us-east-1.rds.amazonaws.com:5432/postgres')
cursor = conn.cursor()

# Check user
cursor.execute('SELECT email, password FROM users WHERE email = %s', ('chenhexumtl@gmail.com',))
user = cursor.fetchone()

if user:
    print(f"User found: {user[0]}")
    print(f"Password hash: {user[1][:20]}...")
else:
    print("User not found!")

conn.close() 