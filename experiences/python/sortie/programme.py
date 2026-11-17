def somme(a: int, b: int, c: int) -> int:
    return ((a + b) + c)
total = 0
total = somme(12, 15, 9)
print(total, end="")
print()
moyenne: float = 12.0
moyenne = (float(total) * 0.3333)
print(f"{moyenne:.2f}", end="")
print()
if moyenne >= 10:
    print("admis", end="")
else:
    print("ajourne", end="")
print()
i = 0
while i < 4:
    i = (i + 1)
    if i == 2:
        continue
    print(i, end="")
print()
assert total == 36
