import player
import console

# открыть консоль
player.interact()

# создать пустой словарь голосующих:
# ключ - id голосующего, значение - кандидат, за которого он голосовал
voters = {}

# пока есть значения в консоли
while console.has_more():
    # прочитать id голосующего и его выбор из консоли
    voter_id = console.read()
    voter_candidate = console.read()

    # если в словаре еще нет ключа voter_id, т.е. это первый голос
    # от этого голосующего, добавить его голос в словарь
    if voter_id not in voters:
        voters[voter_id] = voter_candidate

# создать пустой словарь кандидатов:
# ключ - кандидат, значение - кол-во голосов
candidates = {}

# перебрать всех голосующих
for voter_id in voters:
    # для каждого голосующего получить кандидата
    voter_candidate = voters[voter_id]

    # если это первый голос для данного кандидата,
    # записать в словарь для него 1 голос
    if voter_candidate not in candidates:
        candidates[voter_candidate] = 1
    # иначе добавить к голосам для данного кандидата 1
    else:
        candidates[voter_candidate] += 1

# перебрать всех кандидатов
for candidate in candidates:
    # получить кол-во голосов за кандидата
    candidate_votes = candidates[candidate]
    # записать кандидата и его голоса в вывод
    console.write(candidate)
    console.write(candidate_votes)

# закрыть консоль
console.close()