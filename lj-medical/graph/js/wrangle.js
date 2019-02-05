

function wrangle(csv, cb) {

  d3.csv(csv, function(data) {

    var raw = data;

    var medications = toMedication(raw);
    var persons = toPersons(raw);

    console.log(medications);
    //console.log(persons);

    var wrangled = toGraph(medications, data);
    var inverse = toInverseGraph(persons, data);

    wrangled.inverse = inverse;

    cb(wrangled);

  });
}

function toInverseGraph(persons, data)  {

  var graph = {

    nodes : [],
    links : []

  }

  Object.keys(persons).forEach(person => {

    var node = {
      id : persons[person]["ID"],
      group : 1,
      data : persons[person],
      count : 1
    }

    graph.nodes.push(node);

    Object.keys(persons).forEach(other => {

      var link = {

        source : persons[person]["ID"],
        target : persons[other]["ID"],
        value :  0

      }

      Object.keys (link.source).forEach(medication => {

        if (link.source[medication] == 1 && link.target[medication] == 1) {

          link.value += 1;
        }

      })

      if (link.value == 0) {

        return;
      }

      var exists = false;

      graph.links.forEach(existing => {

        if ((link.source === existing.source && link.target === existing.target) || (link.target === existing.source && link.source === existing.target)) {

          exists = true;
        }

      });

      if (!exists) {

        graph.links.push(link);

      }

    })

  })

  return graph;
}

function toGraph(medications, data) {

  var graph = {

    nodes : [],
    links : []

  }

  Object.keys(medications).forEach(med => {

    var node = {
      id : med,
      group : 1,
      data : medications[med]
    };

    var linkCount = 0;

    Object.keys(node.data.links).forEach(link => {
      linkCount += node.data.links[link];
    });

    node.linkCount = linkCount;
    node.personCount = medications[med].persons.length;

    graph.nodes.push(node);

    Object.keys(medications[med].links).forEach(other => {

      var link = {

        source : med,
        target : other,
        value : medications[med].links[other] / data.length

      }

      var exists = false;

      graph.links.forEach(existing => {

        if ((link.source === existing.source && link.target === existing.target) || (link.target === existing.source && link.source === existing.target)) {

          exists = true;
        }

      });

      if (!exists) {

        graph.links.push(link);

      }

    });

  });

  return graph;
}

function toPersons(data) {

  var persons = {};

  data.forEach((d, i)=> {

    var person = toBoolean(d);

    person.index = i;

    persons[i] = person;

  });

  return persons;
}

function toMedication(data) {

    var medications = {};

    data.forEach(d => {

      var person = toBoolean(d);

      Object.keys(person).forEach(med => {

        if (med === "ID") {

          return;

        }

        if (med in medications) {

          // already in the graph ---

        } else {

          medications[med] = {

            name : med,
            persons : [],

          }
        }

        if (person[med] === 1) {

          medications[med].persons.push(person);

        }

      });

    });

    Object.keys(medications).forEach(med => {

      var links = {};

      Object.keys(medications).forEach(other => {

        if (other === med) {

          return;

        }

        medications[other].persons.forEach(person => {

          if (person[med] === 1) {

            if (other in links) {

                links[other]++;

            } else {

                links[other] = 1;
            }
          }

        });

      });

      medications[med].links = links;

    });

    return medications;
}

function toBoolean(person) {

  var mapped = {};

  Object.keys(person).forEach(med => {

    if (med == "MedrioID") {

      mapped["ID"] = person[med];

    } else {

      if (person[med] === "yes") {

        mapped[med] = 1;

      } else {

        mapped[med] = 0;
      }
    }

  });

  return mapped;
}
